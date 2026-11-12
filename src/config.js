/* =====================================================================
   Birthday Surprise: Configuration
   Everything you want to personalise lives in CONFIG below.
   ===================================================================== */

export const CONFIG = {
  /* INSERT NAME HERE (e.g. 'Sam' or 'Sammy') */
  name: 'Sam',
  fullName: '',

  /* INSERT YOUR NAME HERE (used to sign the letter) */
  from: 'Andre',

  song: {
    /* INSERT SONG URL HERE: drop an .mp3 into public/assets/audio/ and point to it.
       If the file is missing or fails to load, a soft built-in music-box
       lullaby plays instead, so the page never goes silent or breaks. */
    src: 'assets/audio/song.mp3',
    volume: 0.7,

    /* INSERT SONG TITLE / ARTIST HERE */
    title: 'Baby (Remix)',
    artist: 'Justin Bieber',

    /* Optional album-art for the vinyl label. Leave '' to use the first memory photo. */
    cover: 'assets/images/IMG_20260901_233255_746.jpg',

    /* INSERT WHY YOU CHOSE THE SONG HERE */
    linerNotes:
      "Had to put this song on here for you. Hope it gets stuck in your head today. Happy birthday! 🎶",

    /* Shown on the player only if the song file can't be loaded */
    fallbackTitle: 'Stardust Lullaby',
    fallbackArtist: 'a little music box, made for you',
  },

  /* INSERT VOUCHER PRIZE HERE */
  voucher: {
    prize: '1 Sweet Dessert Date (Ice Cream, Cake, or Whatever You Crave!) on Me 🍨🍰',
    fine: 'No expiry · Redeemable anytime · You pick the place 😉',
  },

  /* INSERT MEMORY IMAGES HERE
     Photos of Samantha Nicole in public/assets/images/
     `caption` = front of the polaroid · `back` = message revealed on flip. */
  memories: [
    {
      id: 'snap-1',
      src: 'assets/images/IMG_20260901_230952_379.jpg',
      caption: 'prettiest ✨',
      back: 'Still one of my favorite photos of you 🌸',
      date: 'snap 01',
      tilt: '-3.5deg',
      pin: '#ff7fb5',
    },
    {
      id: 'snap-2',
      src: 'assets/images/IMG_20260901_233255_746.jpg',
      caption: 'golden hour 💛',
      back: 'Golden hour really suits you ✨',
      date: 'snap 02',
      tilt: '2.5deg',
      pin: '#b18cff',
    },
    {
      id: 'snap-3',
      src: 'assets/images/IMG_20260902_003828_384.jpg',
      caption: 'goofy side 🥸',
      back: 'Had to include this one too 😂 never change',
      date: 'snap 03',
      tilt: '-3deg',
      pin: '#7fd4ff',
    },
  ],

  /* INSERT LETTER HERE (line breaks are kept exactly as written) */
  letter: `Hey Sam,

Happy birthday! 🎂

It’s funny how we’ve only been talking for about two months, because talking to you is already my favorite part of the day. Whether you’re being goofy or just telling me about random stuff, you always make me smile.

Since we don’t have any photos together yet, I had to borrow a few of yours for this card. Hopefully we can finally take some of our own soon, especially when we go get that birthday dessert.

I hope you have the best day today, eat all your favorite food, and just enjoy yourself. You deserve it.

Happy birthday, Sam!

{from}`,

  /* QR CODE SETTINGS (formed in a Birthday Cake & Heart that she can scan) */
  qr: {
    /* Live GitHub Pages URL encoded into the Birthday Cake & Heart QR code */
    url: 'https://andr3licious.github.io/happy-birthday-sammy/',
    secretMessage:
      'Happy Birthday, Sam! 🎂💖 You found the secret note. Don’t forget to claim your dessert date soon! - Andre',
  },
};
