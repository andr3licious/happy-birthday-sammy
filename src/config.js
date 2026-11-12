/* =====================================================================
   Birthday Surprise: Configuration
   Everything you want to personalise lives in CONFIG below.
   ===================================================================== */

export const CONFIG = {
  /* INSERT NAME HERE (e.g. 'Sammy' or 'Sam') */
  name: 'Sammy',
  fullName: 'Samantha Nicole',

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
      "A sweet, nostalgic throwback that's impossible not to smile and sing along to. Hope your birthday is filled with this exact happy energy all day long! 🎶✨",

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
      back: 'The little pink birds knew what they were doing. Totally ethereal. 🌸',
      date: 'snap 01',
      tilt: '-3.5deg',
      pin: '#ff7fb5',
    },
    {
      id: 'snap-2',
      src: 'assets/images/IMG_20260901_233255_746.jpg',
      caption: 'golden hour 💛',
      back: 'The lighting is great, but it’s really the girl that makes it stunning. ✨',
      date: 'snap 02',
      tilt: '2.5deg',
      pin: '#b18cff',
    },
    {
      id: 'snap-3',
      src: 'assets/images/IMG_20260902_003828_384.jpg',
      caption: 'goofy side 🥸',
      back: 'Top-tier chaotic humor. Never lose this side of you! 😂',
      date: 'snap 03',
      tilt: '-3deg',
      pin: '#7fd4ff',
    },
  ],

  /* INSERT LETTER HERE (line breaks are kept exactly as written) */
  letter: `Dear Sammy,

Happy birthday! 🎂✨

I know it’s only been about two months since we started talking, but getting to know you has genuinely been one of the sweetest highlights of my days.

You have this effortless way of making conversations fun, brightening up random moments, and making me smile without even trying (and yes, your goofy side and cute selfies definitely help).

We don’t have photos together just yet, but I really hope this year gives us the chance to make plenty of real memories in person.

I hope today treats you to everything you love: all the sweet desserts, great music, endless laughter, and the warmest vibes. You deserve the best year ahead.

Make a big wish today, birthday girl. ✨

Warmest birthday wishes,
{from}`,

  /* QR CODE SETTINGS (formed in a Birthday Cake & Heart that she can scan) */
  qr: {
    /* Live GitHub Pages URL encoded into the Birthday Cake & Heart QR codes */
    url: 'https://andr3licious.github.io/happy-birthday-sammy/',
    secretMessage:
      'Happy Birthday, Sammy! 🎂💖 Secret unlocked: You officially get unlimited sweet dessert dates, endless laughs, and the happiest year ahead! — Andre ✨',
  },
};
