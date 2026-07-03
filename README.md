# Serenity at Dusk do Léo — Fase 1

MVP inicial em Next.js + React + Framer Motion, inspirado no universo de **A Moedinha de Léo**.

## O que já está pronto

- Tela de abertura.
- Cena do quarto do Léo.
- Cena da moedinha na mesa.
- Primeira escolha interativa.
- Dois finais educativos.
- Animações suaves com Framer Motion: fade, zoom, deslocamento leve e partículas.
- Progresso salvo em `localStorage`.
- Pequeno efeito sonoro gerado no navegador ao avançar/escolher.

## Como rodar

```bash
npm install
npm run dev
```

Depois abra:

```bash
http://localhost:3000
```

## Próximas melhorias recomendadas

1. Gerar artes específicas em 16:9 para cada cena, sem textos embutidos na imagem.
2. Criar sprites separados do Léo, moeda, cofrinho e brilho.
3. Adicionar trilha sonora leve com botão de ligar/desligar som.
4. Trocar `localStorage` por Firebase quando houver mais episódios.
5. Criar modo escola/pais com relatório simples das escolhas.
