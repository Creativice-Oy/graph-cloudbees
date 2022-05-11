# Development

This integration focuses on Cloudbees CI and is using
[Cloudbees CI API](https://docs.cloudbees.com/docs/cloudbees-ci-api/latest/api-authentication)
and [Jenkins API](https://www.jenkins.io/doc/book/using/remote-access-api/) for
interacting with the Cloudbees CI resources.

## Prerequisites

Cloudbees CI needs to be deployed using a Kubernetes cluster. For instructions
on how to deploy Cloudbees CI on your preferred cloud provider or on your local
machine. Follow
[this guide](https://docs.cloudbees.com/docs/cloudbees-ci/latest/cloud-onboarding#:~:text=Requirements%20validation%20tool-,Install,-Use%20installation%20instructions).

## Provider account setup

If you don't have a user yet create a user in your Cloudbees CI Operations
Dashboards.

1. In the menu on the left, select **Manage Jenkins**
2. In the **Security** section, select **Manage Users**
3. In the menu on the left, select **Create User**
4. Fill-up the form and then select **Create User**

## Authentication

[Generate an API key](https://docs.cloudbees.com/docs/cloudbees-ci-api/latest/api-authentication).

1. From the dashboard, select your user name on the right of the top navigation
   bar.
2. Select Configure from the left pane.
3. Select Add new Token under API Token.
4. Enter a name to distinguish the token.
5. Select the copy icon and save the token in a safe place so you can use it
   later.

Provide the Username as User ID, API Key, and the Hostname of your deployment in
the `.env`. You can use [.env.example](../.env.example) as reference.
