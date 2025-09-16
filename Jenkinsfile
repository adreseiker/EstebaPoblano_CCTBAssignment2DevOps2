pipeline {
  agent any

  environment {
    REPO_URL          = 'https://github.com/adreseiker/EstebaPoblano_CCTBAssignment2DevOps2.git'
    SSH_CREDS         = 'ssh-key-id'
    SSH_USER          = 'ec2-user'

    TESTING_SERVER    = '13.220.188.19'
    PRODUCTION_SERVER = '18.234.224.105'

    TESTING_URL       = "http://${TESTING_SERVER}/"
    TEST_RESULT_FILE  = 'test_result.txt'

    SSH_OPTS          = '-o StrictHostKeyChecking=no'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {

    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Deploy to Testing') {
      steps {
        sshagent(credentials: [env.SSH_CREDS]) {
          sh """
            set -euo pipefail
            ssh ${SSH_OPTS} ${SSH_USER}@${TESTING_SERVER} '
              set -euo pipefail
              sudo rm -rf /var/www/html && sudo mkdir -p /var/www/html
              sudo chown -R ec2-user:ec2-user /var/www/html
              git clone ${REPO_URL} /var/www/html
              (id apache >/dev/null 2>&1 && sudo chown -R apache:apache /var/www/html) \
                || (id www-data >/dev/null 2>&1 && sudo chown -R www-data:www-data /var/www/html) || true
              sudo restorecon -R /var/www/html 2>/dev/null || true
            '
          """
        }
      }
    }

    stage('Install E2E deps') {
      steps {
        sh '''
          set -euo pipefail
          node -v && npm -v
          npm ci || npm install
          CHROME_MAJOR=$(google-chrome --version | awk '{print $3}' | cut -d. -f1)
          echo "Detected Google Chrome major version: ${CHROME_MAJOR}"
          n





