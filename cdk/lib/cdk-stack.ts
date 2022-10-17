import { LambdaAPI } from "./lambdaAPI";
import { DatabaseProps, LambdaProps } from "./configurations";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { RDS } from "./RDS";
import * as awsLambda from "aws-cdk-lib/aws-lambda";

export class ProxyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new aws_ec2.Vpc(this, `ProxyVPC`, {
      subnetConfiguration: [
        {
          name: "public",
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
        {
          name: "private",
          subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "isolated",
          subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      maxAzs: 2,
    });

    const dbProps = DatabaseProps;
    const database = new RDS(this, "Proxied", { ...dbProps, vpc });
    database.instance.connections.allowInternally(
      aws_ec2.Port.allTcp(),
      "Access for internal resources"
    );

    const lambdaProps = LambdaProps;
    const lambda = new LambdaAPI(this, "Proxy", {
      ...lambdaProps,
      vpc,
      db: database.instance,
    });

    lambda._handler.connections.allowTo(
      database.instance,
      aws_ec2.Port.allTcp(),
      "Access to DB From Lambda"
    );
    database.proxy.grantConnect(lambda._handler);

    const environmentVariables = {
      SECRET_ARN: database.instance.secret?.secretArn || "",
      SECRET_NAME: database.instance.secret?.secretName || "",
    };

    this.AddEnvironmentVariables(environmentVariables, lambda._handler);
  }
  private AddEnvironmentVariables(
    environmentVariables: any,
    api: awsLambda.Function
  ) {
    for (const key in environmentVariables) {
      if (Object.prototype.hasOwnProperty.call(environmentVariables, key)) {
        const value = environmentVariables[key];
        api.addEnvironment(key, value);
      }
    }
  }
}
