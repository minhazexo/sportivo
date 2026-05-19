import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const articles = [
  {
    title: "Premier League Title Race Heats Up as Arsenal Extends Lead",
    slug: "premier-league-title-race-arsenal-extends-lead",
    content: `# Premier League Title Race Heats Up as Arsenal Extends Lead

The 2026 Premier League season has reached its critical juncture, with Arsenal emerging as the frontrunner for the title. Mikel Arteta's side has shown remarkable consistency throughout the campaign, combining defensive solidity with attacking flair.

## Key Factors in Arsenal's Success

The Gunners' title charge has been built on several pillars:

1. **Defensive Resilience**: Arsenal has conceded just 18 goals in 28 matches, the best defensive record in the league.
2. **Bukayo Saka's Emergence**: The young winger has been instrumental, contributing 15 goals and 12 assists.
3. **Home Form**: Emirates Stadium has become a fortress with 13 consecutive home wins.

> "We focus on one game at a time. The title will take care of itself if we maintain our standards." - Mikel Arteta

## Title Race Analysis

Manchester City remains Arsenal's closest challenger, just three points behind with a game in hand. Liverpool, despite a strong start, has faded due to inconsistent away form.

The run-in looks favorable for Arsenal, with crucial fixtures against direct rivals still to be played.

**Upcoming Key Matches:**
- Arsenal vs Manchester City (April 5)
- Liverpool vs Arsenal (April 12)
- Arsenal vs Chelsea (May 3)

With momentum on their side, Arsenal appears primed to end their long wait for Premier League glory.`,
    excerpt: "Arsenal extends their lead at the top of the Premier League with a commanding 3-0 victory over Brighton.",
    category: "Football",
    thumbnail: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
    authorName: "James Wilson",
    tags: ["Premier League", "Arsenal", "Football", "Title Race"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "NBA Playoff Preview: Lakers Face Crucial Matchup Against Suns",
    slug: "nba-playoff-preview-lakers-suns-matchup",
    content: `# NBA Playoff Preview: Lakers Face Crucial Matchup Against Suns

The NBA playoffs are upon us, and all eyes are on the marquee first-round matchup between the Los Angeles Lakers and the Phoenix Suns. This clash promises to be one of the most exciting series of the postseason.

## Series Overview

The Lakers secured the #5 seed after a stellar finish to the regular season, while the Suns claimed the #4 spot in the competitive Western Conference. Both teams enter the playoffs in excellent form.

### Key Players to Watch

**Los Angeles Lakers:**
- LeBron James - averaging 26.8 points per game
- Anthony Davis - dominant on both ends of the floor
- Austin Reaves - breakout star of the season

**Phoenix Suns:**
- Kevin Durant - 27.4 PPG with elite efficiency
- Devin Booker - clutch performances in crucial moments
- Bradley Beal - health permitting

## Tactical Analysis

The matchup will likely be decided in the paint. Davis against Nurkić represents a clash of contrasting styles, while the battle between Durant and James will capture headlines.

> "This is what you play for. The biggest stage, the biggest moments." - LeBron James

**Prediction:** Lakers in 6 games. The experience factor and home-court advantage should prove decisive in a tightly contested series.

Court-side tickets are already selling at premium prices, testament to the anticipation surrounding this matchup.`,
    excerpt: "An in-depth look at the highly anticipated Lakers-Suns playoff series and what to expect.",
    category: "Basketball",
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    authorName: "Marcus Thompson",
    tags: ["NBA", "Lakers", "Suns", "Playoffs"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "Champions League Quarter-Finals: Real Madrid Draw Bayern Munich",
    slug: "champions-league-quarterfinals-real-madrid-bayern",
    content: `# Champions League Quarter-Finals: Real Madrid Draw Bayern Munich

The UEFA Champions League draw has produced a mouth-watering tie between Real Madrid and Bayern Munich. This historic fixture between two of Europe's most successful clubs promises fireworks.

## Historical Context

These giants have met numerous times in Europe's premier competition, with their rivalry dating back to the 1960s. The head-to-head record is remarkably balanced:

- Real Madrid wins: 6
- Bayern Munich wins: 6
- Draws: 4

## What to Expect

### Real Madrid's Perspective

Carlo Ancelotti's side enters as slight favorites, buoyed by the experience of Vinícius Júnior and the clinical finishing of Kylian Mbappé. The midfield battle will be crucial, with Toni Kroos pulling strings against Bayern's Joshua Kimmich.

### Bayern Munich's Outlook

Vincent Kompany has transformed Bayern's defensive organization, while Harry Kane provides proven goalscoring pedigree. The Bavarians will look to attack on the counter, exploiting any space behind Madrid's high line.

> "These are the matches you dream of as a child. Nothing compares to it." - Joshua Kimmich

**First Leg:** Santiago Bernabéu - April 8
**Second Leg:** Allianz Arena - April 16

The winner could face either Arsenal or Manchester City in the semi-finals, adding extra significance to this tie.`,
    excerpt: "Preview of the blockbuster Champions League quarter-final between Real Madrid and Bayern Munich.",
    category: "Football",
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    authorName: "David Rodriguez",
    tags: ["Champions League", "Real Madrid", "Bayern Munich", "Football"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "Formula 1: Verstappen Dominates Season Opener in Bahrain",
    slug: "formula-1-verstappen-bahrain-2026",
    content: `# Formula 1: Verstappen Dominates Season Opener in Bahrain

Max Verstappen has kicked off the 2026 Formula 1 season in imperious fashion, claiming a dominant victory at the Bahrain International Circuit. The Red Bull driver's display was a statement of intent for the campaigns ahead.

## Race Recap

Verstappen started from pole and never looked troubled, controlling the race from start to finish. His margin of victory exceeded 25 seconds, highlighting the disparity in pace between Red Bull and its rivals.

### Podium Finishers
1. **Max Verstappen** - Red Bull Racing
2. **Lando Norris** - McLaren (+25.4s)
3. **Charles Leclerc** - Ferrari (+31.7s)

## Championship Implications

The result has immediately set the tone for the season. Norris's second place represents McLaren's best start in years, suggesting the Woking-based team could challenge for podiums consistently.

> "The car was incredible from the first lap. We executed perfectly." - Max Verstappen

## Season Outlook

With Mercedes showing improvement and Ferrari with work to do, the championship looks like a two-horse race between Verstappen and Norris. The next race in Saudi Arabia will provide further clarity.

**Driver Standings after Round 1:**
- Verstappen: 25 points
- Norris: 18 points
- Leclerc: 15 points`,
    excerpt: "Max Verstappen wins the Bahrain Grand Prix by over 25 seconds in a dominant display.",
    category: "Motorsport",
    thumbnail: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
    authorName: "Sarah Mitchell",
    tags: ["Formula 1", "Verstappen", "Bahrain GP", "Motorsport"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "Wimbledon 2026: Early Predictions and Dark Horses",
    slug: "wimbledon-2026-predictions-dark-horses",
    content: `# Wimbledon 2026: Early Predictions and Dark Horses

With Wimbledon just two months away, tennis enthusiasts are already speculating about potential champions. The grass-court Grand Slam always produces surprises, and 2026 appears particularly unpredictable.

## Favorites

### Men's Draw
**Jannik Sinner** enters as the top seed following his Australian Open triumph. The Italian's all-court game translates perfectly to grass, and his improved serve could be decisive.

**Carlos Alcaraz** remains a dangerous floater. Despite inconsistent results, his peak level can beat anyone on any surface.

### Women's Draw
**Iga Świątek** continues her dominance on clay, but Wimbledon presents different challenges. Her movement and topspin may not translate as effectively to grass.

**Coco Gauff** has emerged as a genuine contender, with her aggressive baseline game suited to quick surfaces.

## Dark Horses to Watch

### Men's Dark Horse: Jack Draper
The British hope has shown steady improvement, and home crowd support could propel him to the second week.

### Women's Dark Horse: Emma Raducanu
Still only 23, Raducanu's mix of power and variety could cause upsets if her confidence returns.

> "Grass is the most demanding surface. Anything can happen." - Tim Henman

## Key Dates
- Qualifying: June 25-28
- Main Draw: July 1-14
- Centre Court Final: July 13

Bookmakers have Sinner as 3/1 favorite, followed by Alcaraz at 5/1. However, Wimbledon historically produces shock results.`,
    excerpt: "Early predictions and dark horse picks for Wimbledon 2026.",
    category: "Tennis",
    thumbnail: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
    authorName: "Emma Thompson",
    tags: ["Tennis", "Wimbledon", "Predictions", "Dark Horses"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "Transfer News: Record-Breaking Deal for Football's Next Superstar",
    slug: "transfer-news-record-deal-next-superstar",
    content: `# Transfer News: Record-Breaking Deal for Football's Next Superstar

The football world is buzzing with news of a record-breaking transfer that could reshape the sport's economics. A €250 million move is in the final stages, marking a new era in player valuations.

## The Deal

The player's identity remains protected pending official announcement, but sources indicate this involves one of Europe's most exciting young talents. The buying club has triggered an unprecedented release clause.

### Deal Breakdown
- **Transfer Fee:** €250 million
- **Weekly Wages:** €850,000
- **Contract Length:** 6 years
- **Agent Fee:** €30 million

## Market Implications

This transfer will inevitably impact the market. Clubs worldwide will use this as a benchmark, pushing valuations of similar players upward.

> "We're entering a new era of transfer fees. The sky is no longer the limit." - Football analyst

## Fan Reaction

Social media has exploded with opinions, ranging from excitement to concern about football's direction. Many question whether any player can be worth such a sum, while others see it as justified in the modern game.

**Historical Context:**
- 2017: Neymar to PSG - €222M (previous record)
- 2021: Messi leaves Barcelona - Free transfer
- 2026: New record set - €250M

The deal is expected to be confirmed within the week, with medical tests scheduled for Tuesday.`,
    excerpt: "A record-breaking €250 million transfer is set to redefine football's transfer market.",
    category: "Football",
    thumbnail: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    authorName: "Robert Williams",
    tags: ["Transfer", "Football", "News", "Transfer Market"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "NFL Draft 2026: Top Quarterback Prospects Analyzed",
    slug: "nfl-draft-2026-quarterback-prospects",
    content: `# NFL Draft 2026: Top Quarterback Prospects Analyzed

With the NFL Draft approaching, teams are finalizing their evaluations of top prospects. This year's quarterback class offers intriguing options at the top, with several franchise-changing talents available.

## Top Prospects

### 1. Caleb Williams (USC)
**Strengths:**
- Exceptional arm talent
- Playmaking ability under pressure
- Leadership qualities

**Concerns:**
- Tendency to hold onto ball too long
- Occasional accuracy lapses

### 2. Drake Maye (North Carolina)
**Strengths:**
- Size and athleticism
- Quick release
- Football IQ

**Concerns:**
- Decision-making improvements needed
- Inconsistent supporting cast in college

### 3. J.J. McCarthy (Michigan)
**Strengths:**
- National champion pedigree
- Accuracy and timing
- Mobility

**Concerns:**
- Conservative nature
- System player questions

## Team Needs

**Picking at #1:** Jacksonville Jaguars - Clearly need their franchise quarterback after Trevor Lawrence's injuries.

**Dark Horse:** New York Giants at #4 - Could trade up or select the best available QB.

> "This quarterback class has something for everyone. The challenge is separating the elite from the very good." - NFL Draft analyst

## Mock Draft Predictions

1. Jaguars select Caleb Williams
2. Las Vegas Raiders select Drake Maye
3. New York Jets select J.J. McCarthy
4. Giants select whichever QB falls

The draft begins April 24 in Green Bay, Wisconsin.`,
    excerpt: "Breaking down the top quarterback prospects in the 2026 NFL Draft class.",
    category: "American Football",
    thumbnail: "https://images.unsplash.com/photo-1566577739112-5238eb28e64f?w=800&q=80",
    authorName: "Michael Davis",
    tags: ["NFL", "Draft", "Quarterback", "American Football"],
    status: "published",
    publishedAt: new Date()
  },
  {
    title: "Cricket World Cup: India Favorite Despite Australia Challenge",
    slug: "cricket-world-cup-india-australia",
    content: `# Cricket World Cup: India Favorite Despite Australia Challenge

The ICC Cricket World Cup 2026 is set to be one of the most competitive editions in recent memory. India enters as betting favorite, but Australia's historical pedigree in global tournaments cannot be ignored.

## Tournament Preview

Host nation USA will see matches across iconic venues, with the final scheduled for Lord's Cricket Ground in London.

### Title Contenders

**India:**
- Batting depth unmatched
- Jasprit Bumrah leads world-class attack
- Captain Rohit Sharma in prime form

**Australia:**
- Five-time World Cup winners
- Experience in crucial moments
- Pat Cummins as bowling leader

> "The pressure of a World Cup brings out the best in Australian teams." - Michael Clarke

## Key Matches to Watch

**Group Stage:**
- India vs Pakistan (June 15)
- Australia vs England (June 18)
- India vs Australia (June 25)

## Dark Horses

**England:** The 2019 champions have rebuilt and could surprise.

**South Africa:** Often underachieve in tournaments but possess world-class talent.

**New Zealand:** Consistent semi-finalists with no fear of big occasions.

## Prediction

Final: India vs Australia

India wins by 35 runs in a thriller at Lord's.

The tournament begins June 5, with all matches broadcast globally.`,
    excerpt: "Preview and predictions for the 2026 Cricket World Cup.",
    category: "Cricket",
    thumbnail: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    authorName: "Raj Patel",
    tags: ["Cricket", "World Cup", "India", "Australia"],
    status: "published",
    publishedAt: new Date()
  }
];

async function main() {
  console.log('Starting database seed...\n');

  // Delete existing articles
  await prisma.article.deleteMany();
  console.log('Cleared existing articles\n');

  // Create articles
  for (const article of articles) {
    const created = await prisma.article.create({
      data: article
    });
    console.log(`Created: ${created.title}`);
  }

  console.log(`\n✓ Successfully seeded ${articles.length} articles`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });