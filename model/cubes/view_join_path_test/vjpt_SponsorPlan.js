cube(`SponsorPlan`, {
     data_source: 'duckdb',
     sql: `SELECT * FROM read_csv('tables/view_join_path_test/vjpt_sponsor_plan.csv', header=true, auto_detect=true)`,
     public: false,

  dimensions: {
    SponsorPlanId: {
      sql: `sponsor_plan_id`,
      type: `number`,
      primary_key: true,
    },
    SponsorPlanCode: { sql: `sponsor_plan_code`, type: `string` },
    SponsorPlanDescription: { sql: `sponsor_plan_description`, type: `string` },
    PayorGroupCode: { sql: `payor_group_code`, type: `string` },
    PayorGroupDescription: { sql: `payor_group_description`, type: `string` },
    FinancialClassGroupCode: { sql: `financial_class_group_code`, type: `string` },
    FinancialClassGroupDescription: { sql: `financial_class_group_description`, type: `string` },
  },
});

cube(`SponsorPlan_Current`, { extends: SponsorPlan });

cube(`SponsorPlan_Primary`, { extends: SponsorPlan });