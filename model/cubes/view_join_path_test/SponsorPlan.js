cube(`SponsorPlan`, {
  sql_table: `public.sponsor_plan`,

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
