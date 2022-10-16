import { Construct } from "constructs";
import { aws_ecr_assets, aws_iam, Duration } from "aws-cdk-lib";
import * as awsLambda from "aws-cdk-lib/aws-lambda";
import * as awsApigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { CfnCacheCluster } from "aws-cdk-lib/aws-elasticache";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export interface LambdaApiProps {
  vpc: Vpc;
  db: DatabaseCluster;
  dockerFileDir: string;
  memorySize?: number;
  maxProvisionedConcurrency?: number;
  dataTracing: boolean;
}

export class LambdaAPI extends Construct {
  readonly _handler: awsLambda.DockerImageFunction;

  constructor(scope: Construct, id: string, props: LambdaApiProps) {
    super(scope, id);

    const lambdaRole = new aws_iam.Role(this, "lambdaRole", {
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    lambdaRole.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    const directory = path.resolve(__dirname, "../../");

    const dockerAssetCode = awsLambda.DockerImageCode.fromImageAsset(
      directory,
      {
        file: props.dockerFileDir,
      }
    );

    const handler = new awsLambda.DockerImageFunction(this, "Handler", {
      code: dockerAssetCode,
      timeout: Duration.minutes(3),
      vpc: props.vpc,
      role: lambdaRole,
      logRetention: RetentionDays.ONE_MONTH,
      reservedConcurrentExecutions: 100,
      memorySize: props.memorySize,
      tracing: awsLambda.Tracing.PASS_THROUGH,
    });

    this._handler = handler;
    const corsOptions: awsApigateway.CorsOptions = {
      allowHeaders: [
        "Content-Type",
        "X-Amz-Date",
        "Authorization",
        "X-Api-Key",
      ],
      allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
      allowOrigins: awsApigateway.Cors.ALL_ORIGINS,
      allowCredentials: false,
    };
    const api = new awsApigateway.LambdaRestApi(this, "lambdaApi", {
      handler,
      defaultCorsPreflightOptions: corsOptions,
      deployOptions: {
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: awsApigateway.MethodLoggingLevel.ERROR,
        dataTraceEnabled: props.dataTracing,
      },
    });

    if (props.maxProvisionedConcurrency) {
      const version = this._handler.currentVersion;

      const alias = new awsLambda.Alias(this, `Alias`, {
        aliasName: "prod",
        provisionedConcurrentExecutions: props.maxProvisionedConcurrency,

        version,
      });

      const autoScaler = alias.addAutoScaling({
        maxCapacity: props.maxProvisionedConcurrency,
      });
      autoScaler.scaleOnUtilization({
        utilizationTarget: 0.75,
        scaleInCooldown: Duration.seconds(10),
        disableScaleIn: false,
      });
      autoScaler.node.addDependency(this._handler);
    }
  }
}
