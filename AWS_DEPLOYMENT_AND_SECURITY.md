# AWS Deployment and Security

## Target deployment

```text
User browser
  └─ Next.js site on AWS Amplify Hosting
       └─ HTTPS API on API Gateway
            └─ FastAPI on AWS Lambda (Mangum; container if required)
                 ├─ private S3 temporary objects
                 ├─ Textract document analysis
                 ├─ Bedrock normalization/explanation (optional per request)
                 ├─ PVGIS outbound call (timeout + defensive validation)
                 ├─ deterministic physics/audit modules
                 ├─ DynamoDB metadata only if needed
                 └─ CloudWatch logs/metrics
```

## Build/deploy order

1. Confirm AWS account, region, IAM permissions and service/model availability.
2. Deploy a minimal API health function first; test its public endpoint.
3. Deploy frontend to Amplify with a configurable `NEXT_PUBLIC_API_BASE_URL`.
4. Verify CORS from the deployed frontend origin.
5. Add direct private S3 uploads with short-lived presigned URLs.
6. Add Textract processing; keep manual field input as fallback.
7. Add Bedrock only after document extraction and typed JSON validation work. Check model availability and cost in the actual AWS account/region.
8. Add physics/PVGIS calculations with error handling.
9. Add DynamoDB only if report/session persistence is needed.
10. Show real AWS usage in the video (deployed URL plus a real request/service execution/log, with no secrets or PII visible).

## Runtime choice

FastAPI can be adapted to Lambda using Mangum. If dependencies such as NumPy/pandas/pvlib/Shapely are difficult to package as a zip, consider a Lambda container image. AWS documents the container-image approach here: https://docs.aws.amazon.com/lambda/latest/dg/python-image.html

However, do not spend the entire sprint perfecting packaging. If one AWS-hosted endpoint with a smaller deterministic audit function provides a real meaningful AWS component, get that working early; add heavier calculations carefully.

## Secrets and environment

Never hard-code keys or put `.env` files with secrets in Git. Commit a `.env.example` with placeholder values only. Frontend variables prefixed `NEXT_PUBLIC_` are public and must never contain AWS credentials or private API keys.

Suggested variable names (exact names may be adjusted to the implementation):

```text
NEXT_PUBLIC_API_BASE_URL=
AWS_REGION=
S3_UPLOAD_BUCKET=
DYNAMODB_TABLE_NAME=
BEDROCK_MODEL_ID=
PVGIS_TIMEOUT_SECONDS=8
```

Use IAM roles for AWS-to-AWS access. Grant each runtime only the permissions it needs.

## Document privacy

- S3 buckets remain private.
- Signed upload URLs expire quickly.
- Limit allowed MIME types and object size.
- Use opaque object keys; don't put a person's name or electricity account number in a key.
- Delete raw bill/quote uploads promptly, target 24 hours where lifecycle configuration permits.
- Do not log raw OCR text or full API bodies containing personal data.
- Do not expose source bill images in the public report/repo.
- Avoid persistent personal information unless needed.

## Cost protection

- Use a small number of test documents.
- Set an AWS Budget/usage alert before exposing the endpoint.
- Apply API throttling and sensible request limits.
- Do not allow unrestricted repeated Bedrock/Textract calls from anonymous users.
- Log service errors but redact document content and credentials.
- Check current service/model pricing, free-tier eligibility and regional availability in the AWS Console before relying on a specific model.

## Demo fallback

If Textract or Bedrock access is unavailable, the product must still work through editable manual fields and a deterministic audit. This fallback must be disclosed in the demo; do not claim a live AI pipeline where none ran.
