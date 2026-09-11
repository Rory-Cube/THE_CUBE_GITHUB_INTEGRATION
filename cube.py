# # Cube configuration options: https://docs.cube.dev/reference/configuration/config

# from cube import config
# from datetime import datetime, date, timedelta


# def months_ago(n: int) -> date:
#     """Return today's date minus n calendar months (standard library only)."""
#     today = date.today()
#     month = today.month - n
#     year  = today.year + (month - 1) // 12
#     month = (month - 1) % 12 + 1
#     # Clamp day to the last valid day of the target month
#     import calendar
#     day = min(today.day, calendar.monthrange(year, month)[1])
#     return date(year, month, day)

# # config.scheduled_refresh_time_zones = ["Europe/London"]

# @config('semantic_layer_sync')
# def semantic_layer_sync(ctx: dict) -> list[dict]:
#     return [
#         {
#             "name": "ThoughtSpot Cube Sync",
#             "type": "thoughtspot",
#             "config": {
#                 "database": "d3-demo cx - rory",
#                 "org_id": "0",
#                 # "secret_key":"",
#                 "url": "https://cube-dev.thoughtspot.cloud/",
#                 "username": "rory",
#                 "password": "Vmwv*$@queozTKsn3",
#             },
#         }
#     ]

# # @config('query_rewrite')
# # def query_rewrite(query: dict, ctx: dict) -> dict:
# #   if 'return_flag' in ctx['securityContext']:
# #     query['filters'].append({
# #       'member': 'lineitem.return_flag',
# #       'operator': 'equals',
# #       'values': [ctx['securityContext']['return_flag']]
# #     })
# #   return query


# # ---------------------------------------------------------------------------
# # Granularity ordering — coarser granularities have a higher rank.
# # A pre-aggregation with granularity G can serve a query with granularity Q
# # only when Q is the same or coarser than G (i.e. rank(Q) >= rank(G)).
# # ---------------------------------------------------------------------------
# GRANULARITY_RANK = {
#     "second":  0,
#     "minute":  1,
#     "hour":    2,
#     "day":     3,
#     "week":    4,
#     "month":   5,
#     "quarter": 6,
#     "year":    7,
# }

# # ---------------------------------------------------------------------------
# # Pre-aggregation registry.
# #
# # Each key is a time dimension (e.g. "lineitem.ship_date").
# # Each value is a list of dicts, one per pre-aggregation that uses that
# # time dimension.  Each dict has:
# #   - "granularity"       : the pre-agg's granularity string (must be in
# #                           GRANULARITY_RANK)
# #   - "build_range_start" : a zero-argument lambda returning a date object
# #                           for the earliest date the pre-agg covers
# #
# # At query time we look for ANY pre-agg that can serve the query — meaning
# # its build_range_start <= the query's start date AND its granularity is
# # the same or finer than the query's requested granularity.
# # If no pre-agg qualifies, the out_of_time_range guard filter is injected so
# # the query is routed to the source database safely.
# # ---------------------------------------------------------------------------
# PRE_AGG_REGISTRY = {
#     # lineitem_rollup: day granularity, covers last ~35 years
#     "lineitem.ship_date": [
#         {
#             "granularity": "day",
#             "build_range_start": lambda: date.today() - timedelta(days=12783),  # ~35 years
#         },
#     ],

#     # author has two pre-aggs on the same time dimension:
#     #   author_rollup_by_day    — day granularity, last 1 month
#     #   author_rollup_by_minute — minute granularity, last 1 day
#     "author.timestamp": [
#         {
#             "granularity": "day",
#             "build_range_start": lambda: months_ago(1),
#         },
#         {
#             "granularity": "minute",
#             "build_range_start": lambda: date.today() - timedelta(days=1),
#         },
#     ],
    
#     # author_view has two pre-aggs on the same time dimension:
#     #   author_rollup_by_day    — day granularity, last 1 month
#     #   author_rollup_by_minute — minute granularity, last 1 day
#     "author_view.timestamp": [
#         {
#             "granularity": "day",
#             "build_range_start": lambda: months_ago(1),
#         },
#         {
#             "granularity": "minute",
#             "build_range_start": lambda: date.today() - timedelta(days=1),
#         },
#     ],
# }


# def _preagg_can_serve(preagg: dict, query_start: date, query_granularity: str) -> bool:
#     """Return True if the pre-agg covers both the date range AND granularity of the query.

#     A pre-agg qualifies when:
#       1. The query's start date falls within its build range (query_start >= build_range_start).
#       2. The query's granularity is the same or coarser than the pre-agg's granularity —
#          e.g. a 'day' pre-agg can serve 'day', 'week', 'month' … queries, but NOT 'hour'
#          or 'minute' queries which need finer-grained data than what was rolled up.
#     """
#     preagg_rank = GRANULARITY_RANK.get(preagg["granularity"], -1)
#     query_rank  = GRANULARITY_RANK.get(query_granularity, -1)

#     date_in_range  = query_start >= preagg["build_range_start"]()
#     granularity_ok = query_rank >= preagg_rank   # query is same or coarser

#     return date_in_range and granularity_ok


# @config('query_rewrite')
# def query_rewrite(query: dict, ctx: dict) -> dict:
#     time_dimensions = query.get('timeDimensions', []) or []

#     for td in time_dimensions:
#         dimension         = td.get('dimension')
#         date_range        = td.get('dateRange')
#         query_granularity = td.get('granularity') or 'day'  # Cube defaults to day when unset

#         # Only act on explicit [start, end] date ranges — skip relative
#         # strings like "last 7 days" which Cube resolves at runtime.
#         if (
#             dimension
#             and isinstance(date_range, list)
#             and len(date_range) == 2
#         ):
#             preaggs = PRE_AGG_REGISTRY.get(dimension)

#             if preaggs:
#                 cube_name   = dimension.split('.')[0]
#                 query_start = datetime.fromisoformat(date_range[0]).date()

#                 # Check whether ANY registered pre-agg can serve this query.
#                 # A pre-agg qualifies only when BOTH conditions hold:
#                 #   1. The query's start date falls within its build range, AND
#                 #   2. The query's granularity is the same or coarser than the
#                 #      pre-agg's granularity (e.g. a "day" pre-agg cannot serve
#                 #      a "minute" query — it lacks the required fine-grained data).
#                 any_preagg_serves = any(
#                     _preagg_can_serve(pa, query_start, query_granularity)
#                     for pa in preaggs
#                 )

#                 if not any_preagg_serves:
#                     query.setdefault('filters', []).append({
#                         'member': f'{cube_name}.out_of_time_range',
#                         'operator': 'equals',
#                         'values': ['1'],
#                     })

#     return query


# # # check what the security context is.
# # @config('query_rewrite')
# # def query_rewrite(query: dict, ctx: dict) -> dict:
# #     the_security_context = ctx['securityContext']
# #     print('Security context:', the_security_context)
# #     return query

# # If customer_child is in query, requrie customer.
# from cube import config

# @config('query_rewrite')
# def query_rewrite(query, ctx):
#     # Collect all members referenced in the query
#     members = (
#         query.get('measures', [])
#         + query.get('dimensions', [])
#         + [f.get('member') for f in query.get('filters', []) if f.get('member')]
#         + [td.get('dimension') for td in query.get('timeDimensions', []) if td.get('dimension')]
#         + [s.get('id') for s in query.get('segments', []) if isinstance(s, dict) and s.get('id')]
#     )

#     # Helper: which cube does a member belong to?
#     def cube_of(member):
#         return member.split('.')[0] if member else None

#     cubes_in_query = {cube_of(m) for m in members if m}

#     # If customer_child is referenced, require customer to also be present
#     if 'customer_child' in cubes_in_query and 'customer' not in cubes_in_query:
#         # Block the query by raise Exception
#         raise Exception(
#             "Queries on 'customer_child' must also include a member from the 'customer' cube."
#         )

#     return query





# from cube import config

# # ---------------------------------------------------------------------------
# # Multi-tenancy: company_orders
# # Each tenant (company) gets a separate compiled data model keyed by their
# # company_id so that COMPILE_CONTEXT correctly routes them to their own CSV.
# # ---------------------------------------------------------------------------

# # @config('context_to_app_id')
# # def context_to_app_id(ctx: dict) -> str:
# #     """Derive a unique app-id per company tenant.

# #     Resolution order:
# #       1. securityContext.company_id  — set when calling via API with a JWT
# #       2. securityContext.cubeCloud.userAttributes.customer_id  — set for
# #          Cube Cloud users whose profile has the customer_id user attribute
# #       3. Falls back to 'default' so existing cubes compile normally.
# #     """
# #     sc = ctx.get('securityContext') or {}
# #     # Direct JWT claim
# #     if sc.get('company_id'):
# #         return f"COMPANY_{sc['company_id']}"
# #     # Cube Cloud user attribute
# #     try:
# #         cid = sc['cubeCloud']['userAttributes']['customer_id']
# #         if cid:
# #             return f"COMPANY_{cid}"
# #     except (KeyError, TypeError):
# #         pass
# #     return 'default'


# # @config('scheduled_refresh_contexts')
# # def scheduled_refresh_contexts() -> list:
# #     """One refresh context per company (companies 1-7)."""
# #     return [
# #         {'securityContext': {'company_id': str(i)}}
# #         for i in range(1, 8)
# #     ]

# DUMMY_ACADIA_ID = "123456789"

# @config('context_to_app_id')
# def context_to_app_id(ctx: dict) -> str:
#   context = ctx['securityContext']
#   print("context: ")
#   print(context)

#   if 'cubeCloud' in context and 'company_id' not in context:
#     cube_cloud = context.get('cubeCloud', {})
#     email = cube_cloud.get('userAttributes', {}).get('email', '')
#     if email.endswith('@cube.com'):
#       return f"account_{DUMMY_ACADIA_ID}"

#   if not context.get('company_id'):
#     raise Exception('STOP IN THE NAME OF ACCESS!')

#   return f"account_{context['company_id']}"

# @config('scheduled_refresh_contexts')
# def scheduled_refresh_contexts() -> list[object]:
#   return [
#     {
#       'securityContext': {
#         'company_id': DUMMY_ACADIA_ID
#       }
#     }
#   ]




# from cube import config

# import os

# import jwt
# import datetime

# config.http = {
#     'cors': {
#         'origin': '*'
#         # 'origin': ['http://localhost:5173', 'https://rory-cube.github.io']
#     }
# }

# token = jwt.sign if False else jwt.encode(
#     {'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)},
#     os.getenv("CUBEJS_API_SECRET"),
#     algorithm='HS256',
# )
# print(token)

from cube import config