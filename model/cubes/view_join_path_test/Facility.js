cube(`Facility`, {
  sql_table: `public.facility`,

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
