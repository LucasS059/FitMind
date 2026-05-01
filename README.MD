🧠 FitMind - Repositório Oficial de Desenvolvimento
Este é o repositório central contendo o código-fonte de produção do FitMind, um sistema mobile desenvolvido como Projeto Integrador (2026) no Instituto Mauá de Tecnologia. O objetivo do software é combater o sedentarismo e facilitar o acesso à prática esportiva através de geolocalização e engajamento social.

🛠️ Stack Tecnológica
Frontend: React Native com Expo (SDK 54).

Backend & Database: Supabase (PostgreSQL) para persistência e autenticação.

Gerenciamento de Estado: Hooks nativos do React e Context API.

Navegação: React Navigation (Bottom Tabs).

🚀 Guia de Configuração e Execução
Siga os passos abaixo para preparar o ambiente de desenvolvimento local.

1. Preparação do Ambiente
Certifique-se de ter instalado em sua máquina:

Node.js (v18+)

npm (ou Yarn)

Expo Go (no smartphone para testes físicos)

2. Instalação de Dependências
Clone o repositório de produção e instale os pacotes necessários:

Bash
# Clone o projeto
git clone [URL_DO_REPOSITORIO]

# Acesse o diretório
cd fitmind

# Instale os módulos (respeitando o package-lock.json)
npm install
3. Variáveis de Ambiente (.env)
O sistema depende de chaves de API para comunicação com o Supabase e outros serviços. Você deve criar um arquivo .env na raiz do projeto com as credenciais.

🔗 Importante: As chaves de acesso atualizadas para o ambiente de desenvolvimento/produção estão disponíveis no link abaixo:
[LINK DAS VARIÁVEIS AQUI]

4. Inicialização do Sistema
Para garantir que o bundle seja gerado sem conflitos de cache e com as variáveis de ambiente carregadas:

Bash
npx expo start -c
🏗️ Estrutura do Projeto
/src/screens: Interfaces principais (Home, Explorar, Perfil).

/src/services: Configurações de API e cliente Supabase.

/src/assets: Recursos estáticos (imagens, ícones).

⚠️ Diretrizes de Desenvolvimento
Ambiente Local: Nunca execute o projeto dentro de diretórios sincronizados por serviços de nuvem (como OneDrive ou iCloud), pois isso causa erros de permissão e falhas no npm install.

Branches: Siga o padrão de branches acordado com a equipe para submissão de novas funcionalidades.

Logs: Verifique sempre o terminal para alertas de sincronização com o banco de dados PostgreSQL.

Desenvolvido por FitMind - 2026