# AWS IAM Permissions Required for CloudEvy Scheduled Configuration Scaling

## Error: "This operation is not available for free plan accounts"

This error usually indicates an **IAM permissions issue**, NOT an AWS account plan limitation. AWS allows instance type modifications on all accounts (including free tier), but you need the correct IAM permissions.

## Required IAM Permissions

Add these permissions to your IAM user/role that CloudEvy uses:

### For Instance Type Scaling:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:ModifyInstanceAttribute",
                "ec2:StopInstances",
                "ec2:StartInstances",
                "ec2:RebootInstances"
            ],
            "Resource": "*"
        }
    ]
}
```

### For EBS Volume Scaling:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeVolumes",
                "ec2:ModifyVolume",
                "ec2:DescribeVolumesModifications"
            ],
            "Resource": "*"
        }
    ]
}
```

### Complete Combined Policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CloudEvyScheduledScaling",
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeVolumes",
                "ec2:DescribeVolumesModifications",
                "ec2:ModifyInstanceAttribute",
                "ec2:ModifyVolume",
                "ec2:StopInstances",
                "ec2:StartInstances",
                "ec2:RebootInstances"
            ],
            "Resource": "*"
        }
    ]
}
```

## How to Add Permissions

### Option 1: AWS Console
1. Go to **IAM** → **Users** → Select your CloudEvy IAM user
2. Click **Add permissions** → **Attach policies directly**
3. Click **Create policy**
4. Switch to **JSON** tab
5. Paste the combined policy above
6. Name it: `CloudEvyScheduledScaling`
7. Create and attach the policy

### Option 2: AWS CLI
```bash
# Create the policy
aws iam create-policy \
  --policy-name CloudEvyScheduledScaling \
  --policy-document file://cloudevy-scaling-policy.json

# Attach to your IAM user
aws iam attach-user-policy \
  --user-name YOUR_CLOUDEVY_IAM_USER \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/CloudEvyScheduledScaling
```

## Common Issues

### 1. "UnauthorizedOperation"
- **Cause**: Missing IAM permissions
- **Fix**: Add the permissions above

### 2. "InvalidParameterValue" 
- **Cause**: Incompatible instance type (e.g., trying to change from t2 to t3a on an instance without ENA support)
- **Fix**: Choose compatible instance types in the same family

### 3. "IncorrectInstanceState"
- **Cause**: Instance must be stopped to change type
- **Fix**: CloudEvy handles this automatically, but ensure no other processes are modifying the instance

### 4. Free Tier Compatibility
- ✅ **Instance type changes**: Fully supported on free tier
- ✅ **EBS volume modifications**: Fully supported on free tier  
- ❌ **Cost Explorer API**: NOT supported on free tier (costs $0.01 per request)

## Testing Your Permissions

Run this AWS CLI command to test:
```bash
# Test if you can describe instances
aws ec2 describe-instances

# Test if you can modify instance attribute (dry-run)
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --instance-type t3.micro \
  --dry-run
```

If you get permission errors, your IAM user needs the policies above.

## Security Best Practices

### Restrict by Tags (Recommended)
Instead of `"Resource": "*"`, restrict to specific instances:
```json
{
    "Effect": "Allow",
    "Action": [
        "ec2:ModifyInstanceAttribute",
        "ec2:StopInstances",
        "ec2:StartInstances"
    ],
    "Resource": "arn:aws:ec2:*:*:instance/*",
    "Condition": {
        "StringEquals": {
            "ec2:ResourceTag/ManagedBy": "CloudEvy"
        }
    }
}
```

Then tag your instances with `ManagedBy=CloudEvy`.

## Support

If you continue to get permission errors after adding these policies:
1. Wait 5-10 minutes for IAM changes to propagate
2. Check CloudLogs in CloudEvy for detailed error messages
3. Verify the IAM user credentials in CloudEvy match the user you added permissions to

