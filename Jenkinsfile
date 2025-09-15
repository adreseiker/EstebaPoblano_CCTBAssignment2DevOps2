pipeline {
  agent any

  environment {
    REPO_URL          = 'https://github.com/adreseiker/EstebaPoblano_CCTBAssignment2DevOps2.git'
    SSH_CREDS         = 'ssh-key-id'    // ID real de tu credencial
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
              # 1) carpeta limpia
              sudo rm -rf /var/www/html && sudo mkdir -p /var/www/html
              # 2) permisos para clonar
              sudo chown -R ec2-user:ec2-user /var/www/html
              # 3) clonar
              git clone ${REPO_URL} /var/www/html
              # 4) devolver propiedad al webserver
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
          # Si hay package-lock usarlo; si no, instala normal
          npm ci || npm install

          # === Sincronizar ChromeDriver con Chrome instalado ===
          # Obtén la versión mayor de Google Chrome (p.ej. 140)
          CHROME_MAJOR=$(google-chrome --version | awk '{print $3}' | cut -d. -f1)
          echo "Detected Google Chrome major version: ${CHROME_MAJOR}"

          # Instala exactamente ese chromedriver (local en node_modules)
          npm install -D chromedriver@${CHROME_MAJOR} --no-audit --no-fund

          # Mostrar versión para debug
          npx chromedriver --version || true
        '''
      }
    }

    stage('Run Selenium Tests') {
      steps {
        script {
          writeFile file: env.TEST_RESULT_FILE, text: 'false'
          withEnv(["TESTING_URL=${env.TESTING_URL}"]) {
            sh '''
              set -euo pipefail
              # Asegurar que el chromedriver local esté primero en PATH
              export PATH="$PWD/node_modules/.bin:$PATH"
              npm run --silent test:e2e
            '''
            writeFile file: env.TEST_RESULT_FILE, text: 'true'
            echo 'E2E passed'
          }
        }
      }
    }

    stage('Deploy to Production') {
      when { expression { fileExists(env.TEST_RESULT_FILE) && readFile(env.TEST_RESULT_FILE).trim() == 'true' } }
      steps {
        sshagent(credentials: [env.SSH_CREDS]) {
          sh """
            set -euo pipefail
            # Prepara docroot en PROD y sincroniza desde el workspace
            ssh ${SSH_OPTS} ${SSH_USER}@${PRODUCTION_SERVER} 'sudo mkdir -p /var/www/html && sudo chown -R ec2-user: /var/www/html'

            rsync -az --delete -e "ssh ${SSH_OPTS}" \
              --exclude ".git" --exclude "node_modules" \
              ./ ${SSH_USER}@${PRODUCTION_SERVER}:/var/www/html/

            ssh ${SSH_OPTS} ${SSH_USER}@${PRODUCTION_SERVER} '(id apache >/dev/null 2>&1 && sudo chown -R apache:apache /var/www/html) || (id www-data >/dev/null 2>&1 && sudo chown -R www-data:www-data /var/www/html) || true'
            ssh ${SSH_OPTS} ${SSH_USER}@${PRODUCTION_SERVER} 'sudo restorecon -R /var/www/html 2>/dev/null || true'
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



