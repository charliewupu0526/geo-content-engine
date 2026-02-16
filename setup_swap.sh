#!/bin/bash
set -e

# Ref: https://aws.amazon.com/premiumsupport/knowledge-center/ec2-memory-swap-file/

# Check if swap already exists
if swapon -s | grep -q "/swapfile"; then
    echo "Swap file already exists."
    exit 0
fi

echo "Creating 2GB swap file..."
sudo dd if=/dev/zero of=/swapfile bs=128M count=16
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo "Verifying swap..."
sudo swapon -s

echo "Making swap permanent..."
echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab

echo "Done!"
free -h
