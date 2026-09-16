cube(`PatientAccountSnapshot`, {
  sql_table: `public.patient_account_snapshot`,
  description: `Daily account-level AR snapshot. Underlying data refreshes weekly; daily rows repeat the latest weekly state.`,

  joins: {
    Facility: {
      relationship: `many_to_one`,
      sql: `${CUBE}.facility_id = ${Facility}.facility_id`,
    },
    LiabilityParty_Current: {
      relationship: `many_to_one`,
      sql: `${CUBE}.current_liability_party_id = ${LiabilityParty_Current}.liability_party_id`,
    },
    LiabilityParty_Primary: {
      relationship: `many_to_one`,
      sql: `${CUBE}.primary_liability_party_id = ${LiabilityParty_Primary}.liability_party_id`,
    },
  },

  dimensions: {
    id: {
      sql: `${CUBE}.report_date || '-' || ${CUBE}.patient_account_number`,
      type: `string`,
      primary_key: true,
    },

    dateDay: {
      sql: `report_date`,
      type: `time`,
      description: `Snapshot report date (daily grain, weekly refresh)`,
    },

    PatientAccountNumber: { sql: `patient_account_number`, type: `string` },
    ClientAccountNumber: { sql: `client_account_number`, type: `string` },
    ClientAccountName: { sql: `client_account_name`, type: `string` },
    HospitalPhysician: { sql: `hospital_physician`, type: `string` },

    AdmitDatetime: { sql: `admit_datetime`, type: `time` },
    DischargeDatetime: { sql: `discharge_datetime`, type: `time` },
    FirstBillDate: { sql: `first_bill_date`, type: `time` },

    BillingStatus: { sql: `billing_status`, type: `string` },
    ClientAccountBillingStatusCode: { sql: `client_account_billing_status_code`, type: `string` },
    ClientAccountBillingStatusDescription: { sql: `client_account_billing_status_description`, type: `string` },

    Balance: { sql: `balance`, type: `number`, description: `Account-level AR balance as of the snapshot` },
    AccountTotalCharges: { sql: `account_total_charges`, type: `number` },

    DaysFromDischarge: { sql: `days_from_discharge`, type: `number` },
    DaysFromInitialSubmit: { sql: `days_from_initial_submit`, type: `number` },
    DaysFromMostRecentSubmit: { sql: `days_from_most_recent_submit`, type: `number` },

    DFDTier: {
      type: `string`,
      description: `Aging bucket by days from discharge`,
      case: {
        when: [
          { sql: `${CUBE}.days_from_discharge <= 30`, label: `0-30` },
          { sql: `${CUBE}.days_from_discharge <= 60`, label: `31-60` },
          { sql: `${CUBE}.days_from_discharge <= 90`, label: `61-90` },
          { sql: `${CUBE}.days_from_discharge <= 120`, label: `91-120` },
          { sql: `${CUBE}.days_from_discharge <= 180`, label: `121-180` },
          { sql: `${CUBE}.days_from_discharge <= 365`, label: `181-365` },
        ],
        else: { label: `365+` },
      },
    },
    DFDTierSort: {
      type: `number`,
      case: {
        when: [
          { sql: `${CUBE}.days_from_discharge <= 30`, label: `1` },
          { sql: `${CUBE}.days_from_discharge <= 60`, label: `2` },
          { sql: `${CUBE}.days_from_discharge <= 90`, label: `3` },
          { sql: `${CUBE}.days_from_discharge <= 120`, label: `4` },
          { sql: `${CUBE}.days_from_discharge <= 180`, label: `5` },
          { sql: `${CUBE}.days_from_discharge <= 365`, label: `6` },
        ],
        else: { label: `7` },
      },
    },

    InitialDFSTier: {
      type: `string`,
      description: `Aging bucket by days from initial claim submission`,
      case: {
        when: [
          { sql: `${CUBE}.days_from_initial_submit IS NULL`, label: `Unbilled` },
          { sql: `${CUBE}.days_from_initial_submit <= 30`, label: `0-30` },
          { sql: `${CUBE}.days_from_initial_submit <= 60`, label: `31-60` },
          { sql: `${CUBE}.days_from_initial_submit <= 90`, label: `61-90` },
          { sql: `${CUBE}.days_from_initial_submit <= 120`, label: `91-120` },
          { sql: `${CUBE}.days_from_initial_submit <= 180`, label: `121-180` },
          { sql: `${CUBE}.days_from_initial_submit <= 365`, label: `181-365` },
        ],
        else: { label: `365+` },
      },
    },
    MostRecentDFSTier: {
      type: `string`,
      description: `Aging bucket by days from most recent claim submission`,
      case: {
        when: [
          { sql: `${CUBE}.days_from_most_recent_submit IS NULL`, label: `Unbilled` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 30`, label: `0-30` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 60`, label: `31-60` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 90`, label: `61-90` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 120`, label: `91-120` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 180`, label: `121-180` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 365`, label: `181-365` },
        ],
        else: { label: `365+` },
      },
    },
    DFSTierSort: {
      type: `number`,
      case: {
        when: [
          { sql: `${CUBE}.days_from_most_recent_submit IS NULL`, label: `0` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 30`, label: `1` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 60`, label: `2` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 90`, label: `3` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 120`, label: `4` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 180`, label: `5` },
          { sql: `${CUBE}.days_from_most_recent_submit <= 365`, label: `6` },
        ],
        else: { label: `7` },
      },
    },

    BalanceTier: {
      type: `string`,
      case: {
        when: [
          { sql: `${CUBE}.balance < 0`, label: `Credit Balance` },
          { sql: `${CUBE}.balance = 0`, label: `Zero Balance` },
          { sql: `${CUBE}.balance < 1000`, label: `$0 - $1K` },
          { sql: `${CUBE}.balance < 5000`, label: `$1K - $5K` },
          { sql: `${CUBE}.balance < 25000`, label: `$5K - $25K` },
          { sql: `${CUBE}.balance < 100000`, label: `$25K - $100K` },
        ],
        else: { label: `$100K+` },
      },
    },
    BalanceTierSort: {
      type: `number`,
      case: {
        when: [
          { sql: `${CUBE}.balance < 0`, label: `0` },
          { sql: `${CUBE}.balance = 0`, label: `1` },
          { sql: `${CUBE}.balance < 1000`, label: `2` },
          { sql: `${CUBE}.balance < 5000`, label: `3` },
          { sql: `${CUBE}.balance < 25000`, label: `4` },
          { sql: `${CUBE}.balance < 100000`, label: `5` },
        ],
        else: { label: `6` },
      },
    },

    ClientPatientTypeCode: { sql: `client_patient_type_code`, type: `string` },
    ClientPatientTypeDescription: { sql: `client_patient_type_description`, type: `string` },
    ClientServiceTypeCode: { sql: `client_service_type_code`, type: `string` },
    ClientServiceTypeDescription: { sql: `client_service_type_description`, type: `string` },
    MinorPatientType: { sql: `minor_patient_type`, type: `string` },
    MinorPatientTypeDescription: { sql: `minor_patient_type_description`, type: `string` },
    MajorPatientType: { sql: `major_patient_type`, type: `string` },
    MajorPatientTypeDescription: { sql: `major_patient_type_description`, type: `string` },

    DischargeDepartmentCode: { sql: `discharge_department_code`, type: `string` },
    DischargeDepartmentName: { sql: `discharge_department_name`, type: `string` },

    OutsourcingVendor: { sql: `outsourcing_vendor`, type: `string` },
  },

  measures: {
    count: {
      type: `count`,
      description: `Account-day records`,
    },
    BalanceSum: {
      sql: `balance`,
      type: `sum`,
      format: `currency`,
    },
    DebitARBalanceSum: {
      sql: `balance`,
      type: `sum`,
      format: `currency`,
      description: `Sum of positive balances only`,
      filters: [{ sql: `${CUBE}.balance > 0` }],
    },
    DebitARAccountCount: {
      type: `count`,
      description: `Count of accounts with a positive balance`,
      filters: [{ sql: `${CUBE}.balance > 0` }],
    },
  },
});
