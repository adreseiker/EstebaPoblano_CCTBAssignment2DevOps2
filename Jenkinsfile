pipeline {
  agent any

  environment {
    // === TU REPO (por si lo necesitas en el futuro) ===
    REPO_URL          = 'https://github.com/adreseiker/EstebaPoblano_CCTBAssignment2DevOps2.git'

    // === CREDENCIAL SSH EN JENKINS (ID) ===
    // Usa el ID real de tu credencial. Según tus logs es "ec2-user".
    SSH_CREDS         = 'ec2-user'
    SSH_USER          = 'ec2-user'

    // === TUS IPs ===
    TESTING_SERVER    = '13.220.188.19'
    PRODUCTION_SERVER = '18.234.224.105'

    TESTING_URL       = "http://${TESTING_SERVER}/"
    TEST_RESULT_FILE  = 'test_result.txt'

    // Opciones SSH comunes
    SSH_OPTS          = '-o StrictHostKeyChecking=no'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {

    stage('Checkout') {
      steps {
        // El job debe ser "Pipeline script from SCM" apuntando a este repo
        checkout scm
      }
    }

    stage('Deploy to Testing') {
      steps {
        sshagent([env.SSH_CREDS]) {
          sh """
            set -euo pipefail
            REMOTE="${SSH_USER}@${TESTING_SERVER}"

            # Asegurar docroot y permisos para copiar
            ssh ${SSH_OPTS} "$REMOTE" 'sudo mkdir -p /var/www/html && sudo chown -R ${SSH_USER}: /var/www/html'

            # Instalar rsync si falta (Amazon Linux/RHEL o Debian/Ubuntu)
            ssh ${SSH_OPTS} "$REMOTE" 'command -v rsync >/dev/null 2>&1 || ( (command -v yum >/dev/null 2>&1 && sudo yum -y install rsync) || (command -v apt-get >/dev/null 2>&1 && sudo apt-get update -y && sudo apt-get install -y rsync) )'

            # Sincronizar desde el workspace a /var/www/html (limpia archivos obsoletos)
            rsync -az --delete -e "ssh ${SSH_OPTS}" \
              --exclude ".git" --exclude "node_modules" \
              ./ "$REMOTE":/var/www/html/

            # Devolver propiedad al usuario del servidor web (apache o www-data)
            ssh ${SSH_OPTS} "$REMOTE" '(id apache >/dev/null 2>&1 && sudo chown -R apache:apache /var/www/html) || (id www-data >/dev/null 2>&1 && sudo chown -R www-data:www-data /var/www/html) || true'

            # SELinux (si aplica)
            ssh ${SSH_OPTS} "$REMOTE" 'sudo restorecon -R /var/www/html 2>/dev/null || true'
          """
        }
      }
    }

    stage('Install E2E deps') {
      steps {
        sh 'node -v && npm -v'      // Node y npm deben estar en el servidor de Jenkins
        sh 'npm ci || npm install'  // instala dependencias (selenium-webdriver, chromedriver, etc.)
      }
    }

    stage('Run Selenium Tests') {
      steps {
        script {
          writeFile file: env.TEST_RESULT_FILE, text: 'false' // default
          withEnv(["TESTING_URL=${env.TESTING_URL}"]) {
            try {
              sh 'npm run --silent test:e2e'   // ejecuta tus pruebas E2E
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
      when {
        expression { fileExists(env.TEST_RESULT_FILE) && readFile(env.TEST_RESULT_FILE).trim() == 'true' }
      }
      steps {
        sshagent([env.SSH_CREDS]) {
          sh """
            set -euo pipefail
            REMOTE="${SSH_USER}@${PRODUCTION_SERVER}"

            ssh ${SSH_OPTS} "$REMOTE" 'sudo mkdir -p /var/www/html && sudo chown -R ${SSH_USER}: /var/www/html'
            ssh ${SSH_OPTS} "$REMOTE" 'command -v rsync >/dev/null 2>&1 || ( (command -v yum >/dev/null 2>&1 && sudo yum -y install rsync) || (command -v apt-get >/dev/null 2>&1 && sudo apt-get update -y && sudo apt-get install -y rsync) )'

            rsync -az --delete -e "ssh ${SSH_OPTS}" \
              --exclude ".git" --exclude "node_modules" \
              ./ "$REMOTE":/var/www/html/

            ssh ${SSH_OPTS} "$REMOTE" '(id apache >/dev/null 2>&1 && sudo chown -R apache:apache /var/www/html) || (id www-data >/dev/null 2>&1 && sudo chown -R www-data:www-data /var/www/html) || true'
            ssh ${SSH_OPTS} "$REMOTE" 'sudo restorecon -R /var/www/html 2>/dev/null || true'
          """
        }
      }
    }

    stage('Smoke on Production') {
      when {
        expression { fileExists(env.TEST_RESULT_FILE) && readFile(env.TEST_RESULT_FILE).trim() == 'true' }
      }
      steps {
        sh "curl -f http://${env.PRODUCTION_SERVER}/ -I | head -n1"
      }
    }
  }

  post {
    always   { archiveArtifacts artifacts: "${env.TEST_RESULT_FILE}", fingerprint: true }
    success  { echo '✅ Pipeline OK' }
    unstable { echo '⚠️ E2E falló: no se desplegó a Prod' }
    failure  { echo '❌ Pipeline FAILED' }
  }
}

