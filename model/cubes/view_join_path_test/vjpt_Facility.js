cube(`Facility`, {
     data_source: 'duckdb',
     sql: `SELECT * FROM read_csv('tables/view_join_path_test/vjpt_facility.csv', header=true, auto_detect=true)`,
     public: false,

  dimensions: {
    FacilityId: {
      sql: `facility_id`,
      type: `number`,
      primary_key: true,
      public: true,
    },
    FacilityName: {
      sql: `facility_name`,
      type: `string`,
    },
  },
});
