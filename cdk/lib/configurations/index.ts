import { LambdaApiProps } from "./../lambdaAPI";
import { Duration } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  AuroraMysqlEngineVersion,
  DatabaseClusterEngine,
} from "aws-cdk-lib/aws-rds";

export const DatabaseProps = {
  dbName: "proxiedDatabase",

  engine: DatabaseClusterEngine.auroraMysql({
    version: AuroraMysqlEngineVersion.VER_2_10_2,
  }),
  instanceType: new ec2.InstanceType("t2.small"),
  subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
  deleteAutomatedBackups: true,
  backup: {
    retention: Duration.days(3),
  },
};

export const LambdaProps = {
  dockerFileDir: "Dockerfile",
  memorySize: 256,
  dataTracing: true,
};
