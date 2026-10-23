// Personalise photographs, media, scrapbook memories and letters here.
// Chapter One, portrait notes, letters and little notes are composed for Ade and Oma.
// Scrapbook chapter titles, captions, photographs and accessible image labels live here.
export const birthday = {
  name: 'Oma',
  portrait: '/images/portrait/oma-through-ades-eyes.jpg',
  cake: '', // Optional standalone photo. The cake page otherwise uses the room’s cake.
  song: '/audio/orente.mp3', // Ade’s supplied MP3, served with the website.
  soundtrack: {
    title: 'Orente',
    artist: 'Adekunle Gold',
  },
  film: '/videos/oma-on-film.mp4',
  filmPoster: '/videos/oma-on-film-poster.webp',
  filmWidth: 960,
  filmHeight: 540,
  gift: '',
  giftDetail: '', // Gift entry stays hidden until Ade supplies the reveal.
};

export const portraitNotes = [
  {
    title: 'The way you laugh',
    body: 'I love your laugh, but I love it even more when we’re together. There’s something about seeing you genuinely happy that makes me happy too.',
  },
  {
    title: 'Your playful side',
    body: 'I love the playful, childish side of you that comes out when you’re with me. The random silliness, the teasing, the little things—you make being with you feel easy and alive.',
  },
  {
    title: 'The dreams you chase',
    body: 'I know how much becoming a successful Medical Laboratory Scientist means to you. I hope you never stop chasing that dream, because I genuinely can’t wait to watch you become everything you’ve worked for. ❤️',
  },
];

export const spreads = [
  {
    id: 'childhood',
    title: 'Before I Knew You',
    description: 'Sometimes I wish I met this little girl too. Just look at her. 🥹❤️',
    descriptionSplitAfter: 'girl too.',
    notePositions: ['lower', 'upper'],
    image: '/images/scrapbook/oma-childhood.png',
    imageAlt: 'Oma as a child in a pink and white dress',
    imageAspect: '3 / 4',
    image2: '/images/scrapbook/oma-school-days.png',
    image2Alt: 'Oma in her school uniform',
    image2Aspect: '175 / 233',
  },
  {
    id: 'beginning',
    title: 'Us, Somehow',
    description: 'Of all the people I could\'ve met, I\'m glad life brought me to you.',
    descriptionSplitAfter: 'could\'ve met,',
    notePositions: ['lower', 'lower'],
    image: '/images/scrapbook/us-formal-mirror.webp',
    imageAlt: 'Ade and Oma standing together for a black and white mirror photograph',
    imageAspect: '1042 / 1280',
    image2: '/images/scrapbook/us-purple-mirror.webp',
    image2Alt: 'Oma and Ade together in a mirror photo under purple light',
    image2Aspect: '203 / 320',
  },
  {
    id: 'oma',
    title: 'My Girl',
    description: 'I love these little moments of us. Even the ones that don\'t seem like much.',
    descriptionSplitAfter: 'moments of us.',
    notePositions: ['upper', 'lower'],
    image: '/images/scrapbook/oma-pink-hat.webp',
    imageAlt: 'Oma wearing a pink hat and pink top',
    imageAspect: '3 / 4',
    image2: '/images/scrapbook/us-mirror.webp',
    image2Alt: 'Oma and Ade hugging in a black and white mirror photo',
    image2Aspect: '3 / 4',
  },
  {
    id: 'through-my-eyes',
    title: 'My New Favourite View',
    description: 'I know I’ve told you this before, but you’re so beautiful, Syl. And somehow, I still find myself staring at your pictures like it’s my first time seeing you.',
    descriptionSplitAfter: 'beautiful, Syl.',
    notePositions: ['middle', 'middle'],
    image: '/images/scrapbook/oma-striped-sweater-seated.webp',
    imageAlt: 'Oma seated cross-legged in a black and white striped sweater',
    imageAspect: '1007 / 1280',
    image2: '/images/scrapbook/oma-striped-sweater-closeup.webp',
    image2Alt: 'Oma smiling in a close-up portrait wearing a black and white striped sweater',
    image2Aspect: '961 / 1280',
  },
  {
    id: 'future',
    title: 'The Pages Ahead',
    description: 'I can\'t wait to see you become everything you\'ve dreamed of. Especially that Medical Laboratory Scientist I know you\'ll be. I\'m rooting for you, always.',
    descriptionSplitAfter: 'dreamed of.',
    notePositions: ['upper', 'lower'],
    image: '/images/scrapbook/oma-black-vest.webp',
    imageAlt: 'Oma wearing a black vest over a white shirt',
    imageAspect: '3 / 4',
    image2: '/images/scrapbook/oma-red-glasses.webp',
    image2Alt: 'Oma wearing red glasses and a black top',
    image2Aspect: '3 / 4',
  },
];

// Retained for future use; archived spreads do not appear in scrapbook navigation.
export const archivedSpreads = [
  {
    title: 'The woman you are becoming',
    image: '/images/scrapbook/oma-school-days.png',
    imageAlt: 'Oma in her school uniform',
    imageAspect: '175 / 233',
    image2: '/images/scrapbook/oma-red-glasses.webp',
    image2Alt: 'Oma wearing red glasses and a black top',
    image2Aspect: '3 / 4',
  },
];

export const letters = [
  {
    id: 'birthday',
    title: 'On your twentieth birthday',
    subtitle: 'For 24 October',
    body: 'My dear Oma,\n\nI made this for your twentieth birthday because I wanted to give you something you could come back to whenever you wanted. I hope you enjoy the photos, the film and everything I’ve written for you.\n\nI love the girl who laughs and teases me, the woman working towards becoming a Medical Laboratory Scientist, and the lady who roots for us and helps settle our arguments. I can’t wait to see what this chapter brings you.\n\nToday, I hope you feel as loved as you made me feel on my last birthday. Happy twentieth birthday, my one in a million.\n\nWith love,\nAde',
  },
  {
    id: 'miss',
    title: 'When you miss me',
    subtitle: 'Until I can give you that hug',
    body: 'My Oma,\n\nI wish I could be beside you when you read this. I miss how silly we get together and how much you make me laugh.\n\nI miss teasing you and being close enough to see your face when something makes you happy. Looking at our pictures makes me want to hold you again.\n\nIf you’re missing me, tell me. I want to hear your voice and know how your day went. I’m looking forward to giving you that hug myself.\n\nWith love,\nAde',
  },
  {
    id: 'courage',
    title: 'When you need a little courage',
    subtitle: 'We’re getting through MLS together',
    body: 'My love,\n\nI know how much becoming a Medical Laboratory Scientist means to you. I want to see you qualify and feel proud of the work you put in.\n\nI can’t wait for the day we both get to say, “We did it.” Until then, tell me about the difficult days too. I might be figuring things out myself, but you can still talk to me. I want us to get through this together.\n\nWith love,\nAde',
  },
  {
    id: 'smile',
    title: 'When you need a smile',
    subtitle: 'You know exactly what I mean',
    body: 'Oma,\n\nRemember how we play with pressing each other’s necks? And how we make up after an argument and start teasing each other again?\n\nI only need to say “AdaOra” and you already know the joke. Nobody else would understand half the things that make us laugh, but you know exactly what I mean.\n\nI love having these little things with you—the teasing, the making up, everything only the two of us can decode. If you’re remembering them now, smile for me. I wish I could see it.\n\nWith love,\nAde',
  },
];

// Keep IDs stable: discovered-note progress is saved using these numbers.
// The shared “With love, Ade” signature is rendered by the note dialog.
export const littleNotes = [
  { id: 1, title: 'Little note 01', body: 'That little girl in her father’s sitting room had no idea I’d be keeping her pictures one day.' },
  { id: 2, title: 'Little note 02', body: 'I’m still keeping that school picture from Fayekemi on my phone.' },
  { id: 3, title: 'Little note 03', body: 'Sometimes all it takes is “AdaOra” and you already know why I’m laughing.' },
  { id: 4, title: 'Little note 04', body: 'I’m looking forward to the day we both graduate and get to say “we did it.”' },
  { id: 5, title: 'Little note 05', body: 'I wanted to do more than send you a birthday message, so I made this for you.' },
  { id: 6, title: 'Little note 06', body: 'I love you, Ihuoma. I hope you know how much.' },
  { id: 7, title: 'Little note 07', body: 'I think of you every time I hear “one in a million” in Orente.' },
  { id: 8, title: 'Little note 08', body: 'If I were beside you right now, this note would be a kiss on your forehead.' },
  { id: 9, title: 'Little note 09', body: 'You’re twenty today, but I’m still going to fuss over you.' },
  { id: 10, title: 'Little note 10', body: 'I hope you feel as loved today as you made me feel on my last birthday.' },
  { id: 11, title: 'Little note 11', body: 'I hope you catch me looking at you and know I’m thinking, “That’s my girl.”' },
  { id: 12, title: 'Little note 12', body: 'I wish I could be sitting beside you while you read this.' },
  { id: 13, title: 'Little note 13', body: 'You look so good in those red glasses. I had to save that photo.' },
  { id: 14, title: 'Little note 14', body: 'I love you in the middle of an ordinary day, when there’s no birthday and no big speech.' },
  { id: 15, title: 'Little note 15', body: 'You don’t have to be in a good mood to be my favourite person.' },
  { id: 16, title: 'Little note 16', body: 'Keep one birthday wish to yourself. I just want to be close enough to see it come true.' },
  { id: 17, title: 'Little note 17', body: 'Save me a hug for when I see you.' },
  { id: 18, title: 'Little note 18', body: 'I want to hear about your day, even if the whole story is just classes and how tired you are.' },
  { id: 19, title: 'Little note 19', body: 'If you were beside me right now, I’d probably be looking for a way to disturb you.' },
  { id: 20, title: 'Little note 20', body: 'I love you, Oma, and I’m glad I get to celebrate you today.' },
];
