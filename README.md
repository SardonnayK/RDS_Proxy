# Requirements

- AWS CLI
- AWS CDK
- Dotnet6 SDK
- Docker

---

# Deployment

- Build the artifact using the [build.cmd](build.cmd)
- Deploy Using the CDK `cdk deploy`

# Need To Know

- The API is set up to only work with the `eu-central-1` region.
- If the region is changed, ensure that the instance types is available within the new region [instance](cdk/lib/configurations/index.ts) `line:15`
- Ensure that the [DBContext](src/EFCore/DBContextInjection.cs) `line:36` uses the correct region.

# Instructions

- The cdk will deploy an api with a single endpoint. The api makes use of swagger to browse the endpoint. The endpoint retrieves data from a database and returns a list of results. Confirm that the result can be returned after the initial set up.

- Once the results are confirmed update the secret, created by the stack, by changing the `host` value to the Proxy endpoint. The Endpoint should now time out.

---

# Permissions

- Lambda Role has admin rights so it should be able to access everything.
- Proxy security group is the same as the RDS security group.
- Database security group allows access from the lambda function
