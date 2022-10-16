#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ProxyStack } from "../lib/cdk-stack";

const app = new cdk.App();
new ProxyStack(app, "ProxyStack");
