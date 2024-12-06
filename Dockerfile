# # Usar a imagem oficial do Node.js
# FROM node:16

# # Criar e definir o diretório de trabalho
# WORKDIR /app

# # Copiar o package.json e package-lock.json
# COPY package*.json ./

# # Instalar dependências
# RUN npm install

# # Copiar o restante dos arquivos
# COPY . .

# # Expor a porta configurada no app
# EXPOSE 3000

# # Comando para rodar a aplicação
# CMD ["node", "app.js"]

# Credits ------------------------------------------------------------------------------------------------------
# Author: Dennye Garcia
# Last Update: Ago-2020
# --------------------------------------------------------------------------------------------------------------

# Usar uma imagem base com suporte a Nginx
FROM nginx:alpine

# Copiar o arquivo HTML e o arquivo de configuração JSON para o diretório do Nginx
COPY nginx/Staticfile /usr/share/nginx/html/Staticfile
COPY index.html /usr/share/nginx/html/index.html
COPY config.json /usr/share/nginx/html/config.json

# Expor a porta do Nginx
EXPOSE 80

# Definir o comando para rodar o Nginx
CMD ["nginx", "-g", "daemon off;"]
