#!/bin/bash
# AWS IAM Permissions Test Script
# This helps diagnose permission issues for CloudEvy scaling

echo "========================================="
echo "CloudEvy IAM Permissions Diagnostic"
echo "========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

echo "Step 1: Checking AWS CLI configuration..."
aws sts get-caller-identity 2>&1 | head -10

if [ $? -ne 0 ]; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

echo ""
echo "✅ AWS CLI configured"
echo ""

# Get current IAM user
USER_ARN=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null)
echo "Current IAM Identity: $USER_ARN"
echo ""

# Ask for instance ID
read -p "Enter your AWS Instance ID (e.g., i-1234567890abcdef0): " INSTANCE_ID

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Instance ID is required"
    exit 1
fi

echo ""
echo "========================================="
echo "Testing Permissions..."
echo "========================================="
echo ""

# Test 1: Describe Instances
echo "Test 1: ec2:DescribeInstances"
aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].[InstanceId,InstanceType,State.Name]' --output table 2>&1 | head -20
if [ $? -eq 0 ]; then
    echo "✅ PASS: Can describe instances"
else
    echo "❌ FAIL: Cannot describe instances"
fi
echo ""

# Get current instance type
CURRENT_TYPE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].InstanceType' --output text 2>/dev/null)
echo "Current Instance Type: $CURRENT_TYPE"
echo ""

# Ask for target instance type
read -p "Enter target instance type to test (e.g., t3.micro): " TARGET_TYPE

if [ -z "$TARGET_TYPE" ]; then
    echo "⚠️  No target type provided, skipping modify test"
else
    echo ""
    # Test 2: Stop Instance (DRY RUN)
    echo "Test 2: ec2:StopInstances (dry-run)"
    aws ec2 stop-instances --instance-ids $INSTANCE_ID --dry-run 2>&1 | head -10
    if [[ $? -eq 0 ]] || [[ $(aws ec2 stop-instances --instance-ids $INSTANCE_ID --dry-run 2>&1) == *"DryRunOperation"* ]]; then
        echo "✅ PASS: Has permission to stop instances"
    else
        echo "❌ FAIL: Cannot stop instances"
    fi
    echo ""

    # Test 3: Modify Instance Attribute (DRY RUN)
    echo "Test 3: ec2:ModifyInstanceAttribute (dry-run)"
    aws ec2 modify-instance-attribute --instance-id $INSTANCE_ID --instance-type $TARGET_TYPE --dry-run 2>&1 | head -10
    MODIFY_RESULT=$?
    if [[ $MODIFY_RESULT -eq 0 ]] || [[ $(aws ec2 modify-instance-attribute --instance-id $INSTANCE_ID --instance-type $TARGET_TYPE --dry-run 2>&1) == *"DryRunOperation"* ]]; then
        echo "✅ PASS: Has permission to modify instance type"
    else
        echo "❌ FAIL: Cannot modify instance type"
        echo ""
        echo "⚠️  Common reasons:"
        echo "    1. IAM permission 'ec2:ModifyInstanceAttribute' not attached"
        echo "    2. Permissions not propagated yet (wait 10 minutes)"
        echo "    3. Instance type incompatibility ($CURRENT_TYPE → $TARGET_TYPE)"
    fi
    echo ""

    # Test 4: Start Instance (DRY RUN)
    echo "Test 4: ec2:StartInstances (dry-run)"
    aws ec2 start-instances --instance-ids $INSTANCE_ID --dry-run 2>&1 | head -10
    if [[ $? -eq 0 ]] || [[ $(aws ec2 start-instances --instance-ids $INSTANCE_ID --dry-run 2>&1) == *"DryRunOperation"* ]]; then
        echo "✅ PASS: Has permission to start instances"
    else
        echo "❌ FAIL: Cannot start instances"
    fi
    echo ""
fi

# Test 5: Describe Volumes
echo "Test 5: ec2:DescribeVolumes"
aws ec2 describe-volumes --filters "Name=attachment.instance-id,Values=$INSTANCE_ID" --query 'Volumes[0].[VolumeId,VolumeType,Size]' --output table 2>&1 | head -20
if [ $? -eq 0 ]; then
    echo "✅ PASS: Can describe volumes"
else
    echo "❌ FAIL: Cannot describe volumes"
fi
echo ""

echo "========================================="
echo "Test Complete"
echo "========================================="
echo ""
echo "If any tests failed, add the CloudEvyScheduledScaling policy:"
echo "AWS Console → IAM → Users → [Your User] → Add Permissions → Create Policy"
echo ""
echo "Policy JSON available in: docs/AWS_SCALING_PERMISSIONS.md"

