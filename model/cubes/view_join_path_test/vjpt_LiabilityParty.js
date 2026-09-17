// Both cubes read the same liability_party table. The snapshot fact carries two
// foreign keys (current_liability_party_id, primary_liability_party_id), so the
// same table is exposed twice to give the view two independent join paths to
// SponsorPlan: PatientAccountSnapshot.LiabilityParty_Current.SponsorPlan and
// PatientAccountSnapshot.LiabilityParty_Primary.SponsorPlan.

// cube(`LiabilityParty_Current`, {
//      data_source: 'duckdb',
//      sql: `SELECT * FROM read_csv('tables/view_join_path_test/vjpt_liability_party.csv', header=true, auto_detect=true)`,
//      public: false,

//   joins: {
//     SponsorPlan: {
//       relationship: `many_to_one`,
//       sql: `${CUBE}.sponsor_plan_id = ${SponsorPlan}.sponsor_plan_id`,
//     },
//   },

//   dimensions: {
//     LiabilityPartyId: {
//       sql: `liability_party_id`,
//       type: `number`,
//       primary_key: true,
//     },
//     LiabilityRank: {
//       sql: `liability_rank`,
//       type: `string`,
//     },
//   },
// });

// cube(`LiabilityParty_Primary`, {
//   extends: LiabilityParty_Current,
// });


cube(`LiabilityParty_Current`, {
      data_source: 'duckdb',
      sql: `SELECT * FROM read_csv('tables/view_join_path_test/vjpt_liability_party.csv', header=true, auto_detect=true)`,
      public: false,
      joins: {
        SponsorPlan_Current: {
          relationship: `many_to_one`,
          sql: `${CUBE}.sponsor_plan_id = ${SponsorPlan_Current}.sponsor_plan_id`,
        },
      },
    dimensions: {
      LiabilityPartyId: {
        sql: `liability_party_id`,
        type: `number`,
        primary_key: true,
      },
      LiabilityRank: {
        sql: `liability_rank`,
        type: `string`,
      },
    },
});

cube(`LiabilityParty_Primary`, {
     data_source: 'duckdb',
     sql: `SELECT * FROM read_csv('tables/view_join_path_test/vjpt_liability_party.csv', header=true, auto_detect=true)`,
     public: false,
  joins: {
    SponsorPlan_Primary: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sponsor_plan_id = ${SponsorPlan_Primary}.sponsor_plan_id`,
    },
  },
  // same dimensions as LiabilityParty_Current
});