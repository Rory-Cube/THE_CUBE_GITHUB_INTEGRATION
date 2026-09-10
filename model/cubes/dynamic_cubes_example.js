// // model/cubes/dynamic_cubes.js
// //
// // Dynamic data model for Cube: introspects Snowflake's INFORMATION_SCHEMA
// // at schema-compile time and generates one cube per table, with dimensions
// // derived from the actual columns.
// //
// // Requires these env vars (the same ones Cube's Snowflake driver already uses):
// //   CUBEJS_DB_SNOWFLAKE_ACCOUNT, CUBEJS_DB_USER,
// //   CUBEJS_DB_SNOWFLAKE_WAREHOUSE, CUBEJS_DB_NAME
// // Optional / auth-dependent:
// //   CUBEJS_DB_SNOWFLAKE_ROLE, CUBEJS_DB_SNOWFLAKE_AUTHENTICATOR,
// //   CUBEJS_DB_PASS (password auth) or CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY /
// //   CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY_PATH (+ _PASS) for key-pair auth
// //   DYNAMIC_SCHEMA (defaults to PUBLIC)

// const snowflake = require('snowflake-sdk');

// // Cube compiles model files in a sandbox without Node globals like `process`.
// // Requiring the built-in module brings the real process object into scope.
// const process = require('process');
// const fs = require('fs');

// const TARGET_SCHEMA = process.env.DYNAMIC_SCHEMA || 'PUBLIC';

// // ---------------------------------------------------------------------------
// // 1. Minimal Snowflake query helper (snowflake-sdk ships with Cube's driver)
// // ---------------------------------------------------------------------------
// // Mirror the env vars Cube's own Snowflake driver uses. Unlike the driver,
// // snowflake-sdk does NOT read these automatically — pass them explicitly.
// function connectionOptions() {
//   const opts = {
//     account: process.env.CUBEJS_DB_SNOWFLAKE_ACCOUNT,
//     username: process.env.CUBEJS_DB_USER,
//     warehouse: process.env.CUBEJS_DB_SNOWFLAKE_WAREHOUSE,
//     database: process.env.CUBEJS_DB_NAME,
//     role: process.env.CUBEJS_DB_SNOWFLAKE_ROLE,
//   };

//   const authenticator = process.env.CUBEJS_DB_SNOWFLAKE_AUTHENTICATOR;
//   if (authenticator) opts.authenticator = authenticator;

//   if (authenticator && authenticator.toUpperCase() === 'SNOWFLAKE_JWT') {
//     // Key-pair auth: Cube supports either the key contents or a path
//     if (process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY) {
//       opts.privateKey = process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY;
//     } else if (process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY_PATH) {
//       opts.privateKey = fs.readFileSync(
//         process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY_PATH,
//         'utf8'
//       );
//     }
//     if (process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY_PASS) {
//       opts.privateKeyPass = process.env.CUBEJS_DB_SNOWFLAKE_PRIVATE_KEY_PASS;
//     }
//   } else {
//     opts.password = process.env.CUBEJS_DB_PASS;
//   }

//   return opts;
// }

// function querySnowflake(sqlText) {
//   return new Promise((resolve, reject) => {
//     const connection = snowflake.createConnection({
//       ...connectionOptions(),
//       schema: TARGET_SCHEMA,
//     });

//     connection.connect((connErr, conn) => {
//       if (connErr) return reject(connErr);
//       conn.execute({
//         sqlText,
//         complete: (err, _stmt, rows) => {
//           conn.destroy(() => {});
//           return err ? reject(err) : resolve(rows);
//         },
//       });
//     });
//   });
// }

// // ---------------------------------------------------------------------------
// // 2. Map Snowflake data types -> Cube dimension types
// //    (INFORMATION_SCHEMA reports canonical names: NUMBER, TEXT, etc.)
// // ---------------------------------------------------------------------------
// function toCubeType(snowflakeType) {
//   const t = snowflakeType.toUpperCase();
//   if (['NUMBER', 'FLOAT', 'REAL', 'FIXED'].includes(t)) return 'number';
//   if (t === 'BOOLEAN') return 'boolean';
//   if (t === 'DATE' || t.startsWith('TIMESTAMP') || t === 'DATETIME') return 'time';
//   if (t === 'GEOGRAPHY' || t === 'GEOMETRY') return 'geo';
//   // TEXT, VARIANT, OBJECT, ARRAY, BINARY, etc. -> string
//   return 'string';
// }

// // ---------------------------------------------------------------------------
// // 3. Fetch column metadata, then register cubes inside asyncModule()
// // ---------------------------------------------------------------------------
// asyncModule(async () => {
//   const rows = await querySnowflake(`
//     SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
//     FROM INFORMATION_SCHEMA.COLUMNS
//     WHERE TABLE_SCHEMA = '${TARGET_SCHEMA}'
//     ORDER BY TABLE_NAME, ORDINAL_POSITION
//   `);

//   // Group columns by table
//   const tables = {};
//   for (const row of rows) {
//     const table = row.TABLE_NAME;
//     if (!tables[table]) tables[table] = [];
//     tables[table].push(row);
//   }

//   const cubeName = (t) => `dce_${t.toLowerCase()}`;
//   const pkOf = (columns) =>
//     columns.find(
//       (c) => c.COLUMN_NAME === 'ID' || (c.ORDINAL_POSITION === 1 && /KEY$/i.test(c.COLUMN_NAME))
//     ) || null;

//   // ---------------------------------------------------------------------
//   // PASS 1: map key SUFFIXES to the cube whose primary key they are.
//   // TPC-H prefixes columns per table (N_REGIONKEY vs R_REGIONKEY), so we
//   // match on the part after the first underscore: REGIONKEY -> dce_region.
//   // Ambiguous suffixes (claimed by 2+ primary keys) are dropped.
//   // ---------------------------------------------------------------------
//   const suffix = (columnName) => columnName.replace(/^[^_]+_/, '');
//   const pkBySuffix = {};
//   for (const [tableName, columns] of Object.entries(tables)) {
//     const pk = pkOf(columns);
//     if (!pk) continue;
//     const s = suffix(pk.COLUMN_NAME);
//     if (pkBySuffix[s]) {
//       pkBySuffix[s] = { ambiguous: true }; // e.g. ORDERKEY if two tables lead with it
//     } else {
//       pkBySuffix[s] = { cube: cubeName(tableName), column: pk.COLUMN_NAME };
//     }
//   }

//   // ---------------------------------------------------------------------
//   // PASS 2: build cubes. Any non-PK *KEY column whose suffix matches
//   // another cube's primary key becomes a many_to_one join to that cube.
//   // ---------------------------------------------------------------------
//   for (const [tableName, columns] of Object.entries(tables)) {
//     const thisCube = cubeName(tableName);
//     const dimensions = {};
//     const joins = {};
//     const measures = {
//       count: { type: 'count' },
//     };

//     for (const col of columns) {
//       const name = col.COLUMN_NAME.toLowerCase();
//       const cubeType = toCubeType(col.DATA_TYPE);
//       const quoted = `"${col.COLUMN_NAME}"`; // preserve case in Snowflake

//       // Primary key conventions:
//       //  - a column literally named ID, or
//       //  - the table's first column when it ends in KEY (TPC-H style:
//       //    R_REGIONKEY, N_NATIONKEY, C_CUSTKEY, ...)
//       const isKeyColumn = /KEY$/i.test(col.COLUMN_NAME);
//       const isPrimaryKey =
//         col.COLUMN_NAME === 'ID' ||
//         (col.ORDINAL_POSITION === 1 && isKeyColumn);

//       dimensions[name] = {
//         // Dynamically generated models bypass Cube's transpiler, so sql must
//         // be a function — and it must be QUALIFIED with the CUBE proxy:
//         // bare columns become ambiguous when two cubes over tables sharing
//         // a column name are joined in one query.
//         sql: (CUBE) => `${CUBE}.${quoted}`,
//         type: cubeType,
//         ...(isPrimaryKey ? { primary_key: true } : {}),
//       };

//       // Foreign-key convention: non-PK *KEY column matching another
//       // cube's primary-key suffix -> many_to_one join to that cube.
//       if (isKeyColumn && !isPrimaryKey) {
//         const target = pkBySuffix[suffix(col.COLUMN_NAME)];
//         if (target && !target.ambiguous && target.cube !== thisCube) {
//           const localColumn = col.COLUMN_NAME;
//           joins[target.cube] = {
//             relationship: 'many_to_one',
//             // Zero-param function, both aliases QUOTED: Cube emits quoted
//             // lowercase aliases (AS "dce_region") and Snowflake uppercases
//             // unquoted identifiers, so unquoted references fail to resolve.
//             sql: () =>
//               `"${thisCube}"."${localColumn}" = "${target.cube}"."${target.column}"`,
//           };
//         }
//       }

//       // Optional: auto-generate sum/avg measures for numeric columns.
//       // Skip key columns — summing surrogate keys is never meaningful.
//       if (cubeType === 'number' && !isPrimaryKey && !isKeyColumn) {
//         measures[`total_${name}`] = { sql: (CUBE) => `${CUBE}.${quoted}`, type: 'sum' };
//         measures[`avg_${name}`] = { sql: (CUBE) => `${CUBE}.${quoted}`, type: 'avg' };
//       }
//     }

//     cube(thisCube, {
//       sql_table: () => `"${TARGET_SCHEMA}"."${tableName}"`,
//       data_source: 'default',
//       joins,
//       dimensions,
//       measures,
//     });
//   }
// });