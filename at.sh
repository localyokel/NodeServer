#!/bin/sh

scp -i ~/ads2.pem static/lymads.js root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/static/
scp -i ~/ads2.pem adtrans.js root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/
scp -i ~/ads2.pem at.js root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/
scp -i ~/ads2.pem static/ntest.html root@ec2-54-241-47-131.us-west-1.compute.amazonaws.com:/srv/node/Adserver/static/

scp -i ~/ads1.pem static/lymads.js root@ec2-54-242-206-21.compute-1.amazonaws.com:/srv/node/Adserver/static/
scp -i ~/ads1.pem adtrans.js root@ec2-54-242-206-21.compute-1.amazonaws.com:/srv/node/Adserver/
scp -i ~/ads1.pem at.js root@ec2-54-242-206-21.compute-1.amazonaws.com:/srv/node/Adserver/
scp -i ~/ads1.pem static/ntest.html root@ec2-54-242-206-21.compute-1.amazonaws.com:/srv/node/Adserver/static/
