import { Construct } from "constructs";
import { Stack, StackProps, App, Duration, CfnOutput } from "aws-cdk-lib";
import * as aws_rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class DatabaseProps {
  // Properties used to alter the database.
  vpc: ec2.Vpc;
  instanceType?: ec2.InstanceType;
  engine: aws_rds.IClusterEngine;
  dbName: string;
  publiclyAccessible?: boolean = true;

  // =================================
  subnetType?: ec2.SubnetType;
  deleteAutomatedBackups?: boolean;
  backup?: aws_rds.BackupProps;
  replicaInstances?: number;
}

export class RDS extends Construct {
  readonly instance: aws_rds.DatabaseCluster;
  readonly proxy: aws_rds.IDatabaseProxy;
  readonly databaseName: string;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    // #region setting defaults
    props.publiclyAccessible = props.publiclyAccessible ?? true;
    props.instanceType = props.instanceType ?? new ec2.InstanceType("t2.small");
    props.subnetType = props.subnetType ?? ec2.SubnetType.PUBLIC;
    props.deleteAutomatedBackups = props.deleteAutomatedBackups ?? true;
    //#endregion

    const engine = props.engine;
    const instance = new aws_rds.DatabaseCluster(this, `DB`, {
      engine,
      defaultDatabaseName: props.dbName,
      instanceProps: {
        vpc: props?.vpc,
        vpcSubnets: { subnetType: props.subnetType },
        instanceType: props.instanceType,
        publiclyAccessible: true,
        deleteAutomatedBackups: props.deleteAutomatedBackups,
      },
      instances: props.replicaInstances,
      backup: props.backup,
    });

    this.instance = instance;
    this.databaseName = props.dbName;

    //--------------DATABASE PROXY--------------------------

    this.proxy = new aws_rds.DatabaseProxy(this, "DatabaseProxy", {
      proxyTarget: aws_rds.ProxyTarget.fromCluster(instance),
      requireTLS: false,
      debugLogging: true,
      secrets: [instance.secret!],
      vpc: props.vpc,
      securityGroups: this.instance.connections.securityGroups,
    });
    new CfnOutput(this, "endpoint", {
      exportName: "proxy-endpoint2",
      value: this.proxy.endpoint,
    });
    const role = new iam.Role(this, "DBProxyRole", {
      assumedBy: new iam.AccountPrincipal(Stack.of(this).account),
    });
    this.proxy.grantConnect(role, "admin");
  }
}
