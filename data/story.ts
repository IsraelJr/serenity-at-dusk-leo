export type SceneId =
  | "start"
  | "room"
  | "drawer"
  | "first_choice"
  | "ending_spend"
  | "ending_save";

export type Choice = {
  label: string;
  next: SceneId;
  tone: "spend" | "save" | "share";
};

export type Scene = {
  id: SceneId;
  kind: "intro" | "scene" | "choice" | "ending";
  title: string;
  eyebrow?: string;
  image: string;
  text: string[];
  choices?: Choice[];
  next?: SceneId;
  lesson?: string;
};

export const story: Record<SceneId, Scene> = {
  start: {
    id: "start",
    kind: "intro",
    title: "Serenity at Dusk do Léo",
    eyebrow: "Episódio 1",
    image: "/assets/cover.svg",
    text: [
      "Uma pequena moedinha pode começar uma grande jornada.",
      "Ajude Léo a fazer sua primeira escolha."
    ],
    next: "room"
  },
  room: {
    id: "room",
    kind: "scene",
    title: "O quarto de Léo",
    image: "/assets/room.svg",
    text: [
      "O sol entrou devagar pela janela do quarto de Léo.",
      "A luz passou pela cama, pelos livros e pelos brinquedos espalhados pelo tapete azul.",
      "Léo abriu os olhos e lembrou de uma coisa importante: sua moedinha estava guardada."
    ],
    next: "drawer"
  },
  drawer: {
    id: "drawer",
    kind: "scene",
    title: "A moedinha apareceu",
    image: "/assets/table-coin.svg",
    text: [
      "Léo procurou com atenção.",
      "Todas as moedinhas eram dele, menos uma.",
      "Ela estava em cima da mesa, brilhando na luz da manhã.",
      "A moedinha parecia perguntar: ‘O que você vai escolher hoje?’"
    ],
    next: "first_choice"
  },
  first_choice: {
    id: "first_choice",
    kind: "choice",
    title: "A primeira escolha",
    image: "/assets/choice.svg",
    text: [
      "Léo segurou a moedinha com cuidado.",
      "Ele poderia comprar algo gostoso agora… ou guardar para fazer um sonho crescer.",
      "O que Léo deve fazer?"
    ],
    choices: [
      { label: "Comprar um doce agora", next: "ending_spend", tone: "spend" },
      { label: "Guardar para um sonho", next: "ending_save", tone: "save" }
    ]
  },
  ending_spend: {
    id: "ending_spend",
    kind: "ending",
    title: "A alegria que passa rápido",
    image: "/assets/spend.svg",
    text: [
      "Léo comprou um doce colorido e ficou feliz.",
      "O doce era gostoso, mas logo acabou.",
      "Quando voltou para casa, Léo pensou na bicicleta, nos livros e nos brinquedos que queria conquistar.",
      "Ele percebeu que algumas alegrias passam rápido."
    ],
    lesson: "Gastar pode ser divertido, mas nem todo gasto aproxima a gente dos nossos sonhos."
  },
  ending_save: {
    id: "ending_save",
    kind: "ending",
    title: "Um sonho mais perto",
    image: "/assets/save.svg",
    text: [
      "Léo respirou fundo e guardou a moedinha.",
      "Plim! O cofrinho brilhou bem fraquinho.",
      "Ainda não era uma bicicleta. Ainda não era um videogame.",
      "Mas era o começo de um grande sonho."
    ],
    lesson: "Guardar é transformar uma pequena escolha de hoje em uma conquista de amanhã."
  }
};
