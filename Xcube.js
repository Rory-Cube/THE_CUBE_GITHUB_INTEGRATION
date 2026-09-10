// // cube.js  (deployment config, lives at the project root)
// //
// // The dynamic model in model/cubes/dynamic_cubes.js only re-runs when Cube
// // recompiles the data model. schemaVersion lets you invalidate the compiled
// // model whenever your Snowflake metadata changes — here we use a cheap
// // "fingerprint" query against INFORMATION_SCHEMA, cached for 5 minutes.

// const snowflake = require('snowflake-sdk');

// let cachedVersion = 'init';
// let lastChecked = 0;
// const CHECK_INTERVAL_MS = 5 * 60 * 1000; // re-check metadata every 5 minutes

// // Same auth-aware options as the model file (duplicated because cube.js and
// // model files are compiled separately — keep the two in sync).
// function connectionOptions() {
//   const fs = require('fs');
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

// function queryFingerprint() {
//   return new Promise((resolve, reject) => {
//     const connection = snowflake.createConnection(connectionOptions());
//     connection.connect((connErr, conn) => {
//       if (connErr) return reject(connErr);
//       conn.execute({
//         // Changes whenever tables/columns are added, dropped, or altered
//         sqlText: `
//           SELECT COUNT(*) AS COLS, MAX(LAST_ALTERED) AS ALTERED
//           FROM INFORMATION_SCHEMA.TABLES
//           WHERE TABLE_SCHEMA = '${process.env.DYNAMIC_SCHEMA || 'PUBLIC'}'
//         `,
//         complete: (err, _stmt, rows) => {
//           conn.destroy(() => {});
//           if (err) return reject(err);
//           const r = rows[0];
//           resolve(`${r.COLS}-${r.ALTERED}`);
//         },
//       });
//     });
//   });
// }

// module.exports = {
//   schemaVersion: async () => {
//     const now = Date.now();
//     if (now - lastChecked > CHECK_INTERVAL_MS) {
//       lastChecked = now;
//       try {
//         cachedVersion = await queryFingerprint();
//       } catch (e) {
//         console.error('schemaVersion fingerprint failed:', e.message);
//       }
//     }
//     return cachedVersion;
//   },
// };