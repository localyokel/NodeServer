#!/bin/sh

scp -i ~/ads2.pem lymads.js root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/

scp -i ~/ads2.pem adtrans.js root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/

scp -i ~/ads2.pem ntest.html root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/
