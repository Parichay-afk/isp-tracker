#!/bin/bash

# ============================================================
# ISP Tracker - One-command deployment script
# Run this from the isp-tracker project folder on your machine
# ============================================================

set -e

echo ""
echo "=================================================="
echo "  ISP Tracker — Deployment Setup"
echo "=================================================="
echo ""

# ---- Collect inputs ----

read -p "Enter your GitHub Personal Access Token (needs repo scope): " GH_TOKEN
echo ""

read -p "Enter your GitHub username: " GH_USER
echo ""

read -p "Enter your Vercel token (from vercel.com/account/tokens): " VERCEL_TOKEN
echo ""

read -p "Enter your Asana PAT (regenerate it first at app.asana.com/0/my-tasks): " ASANA_PAT
echo ""

REPO_NAME="isp-tracker"
TEAM_ID="team_A7fssUWcuB4A3GgyjAKBLBIQ"
SUPABASE_URL="https://uabfpdgrsukwgsbaxhvg.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYmZwZGdyc3Vrd2dzYmF4aHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0Mjc0NDMsImV4cCI6MjA5NzAwMzQ0M30.IfescABXNJToxyhkv_KNBx9fixtpvTC4AN6ApfUnH-c"

# ---- Step 1: Create GitHub repo ----

echo "1/5  Creating GitHub repository..."

EXISTING=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/$GH_USER/$REPO_NAME")

if [ "$EXISTING" = "200" ]; then
  echo "     Repo already exists, skipping creation."
else
  curl -s -X POST \
    -H "Authorization: token $GH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"ISP Tracker - Star International School\"}" \
    "https://api.github.com/user/repos" > /dev/null
  echo "     Created private repo: $GH_USER/$REPO_NAME"
fi

# ---- Step 2: Push code to GitHub ----

echo "2/5  Pushing code to GitHub..."

git remote remove origin 2>/dev/null || true
git remote add origin "https://$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git branch -M main
git push -u origin main --force
echo "     Code pushed to GitHub."

# ---- Step 3: Create Vercel project linked to GitHub ----

echo "3/5  Creating Vercel project..."

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
  npm install -g vercel --silent
fi

# Create project via Vercel API
VERCEL_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"isp-tracker\",
    \"framework\": \"nextjs\",
    \"gitRepository\": {
      \"type\": \"github\",
      \"repo\": \"$GH_USER/$REPO_NAME\"
    },
    \"teamId\": \"$TEAM_ID\"
  }" \
  "https://api.vercel.com/v10/projects?teamId=$TEAM_ID")

PROJECT_ID=$(echo "$VERCEL_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "     Vercel project created. ID: $PROJECT_ID"

# ---- Step 4: Add environment variables ----

echo "4/5  Setting environment variables in Vercel..."

add_env_var() {
  local key=$1
  local value=$2
  local target=$3

  curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[\"$target\"],\"type\":\"encrypted\"}" \
    "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" > /dev/null
}

for TARGET in production preview; do
  add_env_var "ASANA_PAT" "$ASANA_PAT" "$TARGET"
  add_env_var "ASANA_PROJECT_NAME" "Star International Al Twar" "$TARGET"
  add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "$TARGET"
  add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$TARGET"
done

echo "     Environment variables set."

# ---- Step 5: Trigger first deployment ----

echo "5/5  Triggering first deployment..."

curl -s -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"isp-tracker\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repoId\": \"$(curl -s -H \"Authorization: token $GH_TOKEN\" \"https://api.github.com/repos/$GH_USER/$REPO_NAME\" | grep -o '\"id\":[0-9]*' | head -1 | cut -d: -f2)\",
      \"ref\": \"main\"
    },
    \"projectId\": \"$PROJECT_ID\",
    \"teamId\": \"$TEAM_ID\"
  }" \
  "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" > /dev/null

echo ""
echo "=================================================="
echo "  DONE! Your tracker is deploying."
echo ""
echo "  Next steps:"
echo ""
echo "  1. Add custom domain in Vercel dashboard:"
echo "     isp.praxisadvertising.com"
echo ""
echo "  2. In your DNS, add this CNAME record:"
echo "     Name: isp"
echo "     Value: cname.vercel-dns.com"
echo ""
echo "  3. Once live, visit this URL once to register"
echo "     the Asana webhook:"
echo "     https://isp.praxisadvertising.com/api/setup-webhook"
echo ""
echo "  4. Regenerate your Asana PAT at:"
echo "     app.asana.com > My Settings > Apps"
echo "     (since it was shared in chat)"
echo ""
echo "=================================================="
