# Usar a imagem oficial do Node.js
FROM node:16

# Criar e definir o diretório de trabalho
WORKDIR /app

# Copiar o package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos
COPY . .

# Expor a porta configurada no app
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "app.js"]
