#!/bin/bash
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
echo "{ \"metricType\": \"cpu\", \"value\": $CPU }"