pipeline {
  agent any

  environment {
    // === TU REPO (HTTPS público) ===
    REPO_URL          = 'https://github.com/adreseiker/EstebaPoblano_CCTBAssignment2DevOps2.git'

    // === CREDENCIAL SSH EN JENKINS ===
    SSH_CREDS         = 'ssh-key-id'   // Kind: SSH Username with private key (username: ec2-user)

    // === TUS IPs ===
    TESTING_SERVER    = '13.220.188.19'
    PRODUCTION_SERVER = '18.234.224.105'

    TESTING_URL       = "http://${TESTING_SERVER}/"
    TEST_RESULT_FILE  = 'test_result.txt'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {

    stage('Checkout') {
      steps { checkout scm } // el job debe ser "Pipeline script from SCM" apuntando a este repo
    }

    stage('Deploy to Testing') {
      steps {
        sshagent(credentials: [env.SSH_CREDS]) {
          sh """
            ssh -o StrictHostKeyChecking=no ec2-user@${TESTING_SERVER} 'sudo rm -rf /var/www/html/*'
            ssh -o StrictHostKeyChecking=no ec2-user@${TESTING_SERVER} 'git clone ${REPO_URL} /var/www/html'
          """
        }
      }
    }

    stage('Install E2E deps') {
      steps {
        sh 'node -v && npm -v'     // Node y Chrome deben estar instalados en el servidor de Jenkins
        sh 'npm ci || npm install' // instala selenium-webdriver y chromedriver del package.json
      }
    }

    stage('Run Selenium Tests') {
      steps {
        script {
          writeFile file: env.TEST_RESULT_FILE, text: 'false' // default
          withEnv(["TESTING_URL=${env.TESTING_URL}"]) {
            try {
              sh 'npm run --silent test:e2e' // ejecuta selenium-tests/test_form.js y test_validation.js
              writeFile file: env.TEST_RESULT_FILE, text: 'true'
              echo 'E2E passed'
            } catch (e) {
              currentBuild.result = 'UNSTABLE'
              echo "E2E failed: ${e}"
            }
          }
        }
      }
    }

    stage('Deploy to Production') {
      when { expression { fileExists(env.TEST_RESULT_FILE) && readFile(env.TEST_RESULT_FILE).trim() == 'true' } }
      steps {
        sshagent(credentials: [env.SSH_CREDS]) {
          sh """
            ssh -o StrictHostKeyChecking=no ec2-user@${PRODUCTION_SERVER} 'sudo rm -rf /var/www/html/*'
            ssh -o StrictHostKeyChecking=no ec2-user@${PRODUCTION_SERVER} 'git clone ${REPO_URL} /var/www/html'
          """
        }
      }
    }

    stage('Smoke on Production') {
      when { expression { fileExists(env.TEST_RESULT_FILE) && readFile(env.TEST_RESULT_FILE).trim() == 'true' } }
      steps { sh "curl -f http://${env.PRODUCTION_SERVER}/ -I | head -n1" }
    }
  }

  post {
    always   { archiveArtifacts artifacts: "${env.TEST_RESULT_FILE}", fingerprint: true }
    success  { echo '✅ Pipeline OK' }
    unstable { echo '⚠️ E2E falló: no se desplegó a Prod' }
    failure  { echo '❌ Pipeline FAILED' }
  }
}
