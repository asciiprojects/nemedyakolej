name: AsciiPro Crawler
run-name: Crawler ${{ inputs.job_id }}

on:
  workflow_dispatch:
    inputs:
      url:
        description: Authorized HTTPS URL
        required: true
        type: string
      job_id:
        description: Request identifier
        required: true
        type: string

permissions:
  contents: read

jobs:
  crawl:
    runs-on: ubuntu-latest
    env:
      REPORT_URL: ${{ inputs.url }}
      JOB_ID: ${{ inputs.job_id }}
      ALLOWED_HOSTS: ${{ vars.CRAWLER_ALLOWED_HOSTS }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Puppeteer
        run: npm install puppeteer

      - name: Generate inner.html and result.json
        run: node generate.js

      - name: Upload result
        uses: actions/upload-artifact@v4
        with:
          name: result-${{ inputs.job_id }}
          path: |
            inner.html
            result.json
          retention-days: 1
