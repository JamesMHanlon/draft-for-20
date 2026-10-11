// Each list is in ranked order: best first. Edit freely.
// Each game draws a random pool of (players × picks) items, so 40 items lets 8 players take 5 each.
window.GENRES = [
  { id:'nba', name:'NBA Legends', emoji:'🏀', basis:'our all-time list (argue in chat)', items:[
    'Michael Jordan','LeBron James','Kareem Abdul-Jabbar','Magic Johnson','Bill Russell','Wilt Chamberlain','Larry Bird','Tim Duncan','Shaquille O\'Neal','Kobe Bryant',
    'Stephen Curry','Hakeem Olajuwon','Kevin Durant','Nikola Jokić','Kevin Garnett','Giannis Antetokounmpo','Dirk Nowitzki','Oscar Robertson','Jerry West','Moses Malone',
    'Julius Erving','Elgin Baylor','John Stockton','Karl Malone','Charles Barkley','David Robinson','Chris Paul','Kawhi Leonard','Dwyane Wade','Allen Iverson',
    'Steve Nash','Scottie Pippen','Isiah Thomas','John Havlicek','Bob Pettit','Patrick Ewing','Jason Kidd','Dwight Howard','James Harden','Russell Westbrook']},
  { id:'soccer', name:'Soccer Legends', emoji:'⚽', basis:'our all-time list', items:[
    'Lionel Messi','Pelé','Diego Maradona','Cristiano Ronaldo','Johan Cruyff','Zinedine Zidane','Ronaldo Nazário','Franz Beckenbauer','Alfredo Di Stéfano','Ronaldinho',
    'Paolo Maldini','Thierry Henry','Michel Platini','Marco van Basten','Eusébio','Ferenc Puskás','Kylian Mbappé','Zlatan Ibrahimović','Andrés Iniesta','Luka Modrić',
    'Xavi','Gerd Müller','Lev Yashin','Bobby Charlton','George Best','Garrincha','Romário','Rivaldo','Kaká','Roberto Baggio',
    'Lothar Matthäus','Franco Baresi','Gianluigi Buffon','Sergio Ramos','Robert Lewandowski','Erling Haaland','Neymar','Steven Gerrard','Wayne Rooney','Kevin De Bruyne']},
  { id:'movies', name:'Box Office Giants', emoji:'🎬', basis:'worldwide gross (approx.)', items:[
    'Avatar','Avengers: Endgame','Avatar: The Way of Water','Titanic','Ne Zha 2','Star Wars: The Force Awakens','Avengers: Infinity War','Spider-Man: No Way Home','Inside Out 2','Jurassic World',
    'The Lion King (2019)','The Avengers','Furious 7','Top Gun: Maverick','Frozen II','Barbie','Avengers: Age of Ultron','The Super Mario Bros. Movie','Black Panther','Harry Potter: Deathly Hallows Pt 2',
    'Star Wars: The Last Jedi','Jurassic World: Fallen Kingdom','Frozen','Beauty and the Beast (2017)','Incredibles 2','The Fate of the Furious','Iron Man 3','Minions','Captain America: Civil War','Aquaman',
    'LOTR: The Return of the King','Spider-Man: Far From Home','Captain Marvel','Transformers: Dark of the Moon','Skyfall','Transformers: Age of Extinction','The Dark Knight Rises','Joker','Star Wars: The Rise of Skywalker','Toy Story 4']},
  { id:'games', name:'Best-Selling Games', emoji:'🎮', basis:'copies sold (approx.)', items:[
    'Minecraft','Grand Theft Auto V','Wii Sports','Red Dead Redemption 2','PUBG: Battlegrounds','Mario Kart 8 Deluxe','The Witcher 3','Terraria','Super Mario Bros.','Human: Fall Flat',
    'Overwatch','Animal Crossing: New Horizons','Wii Fit','Stardew Valley','Mario Kart Wii','Super Smash Bros. Ultimate','Zelda: Breath of the Wild','Wii Sports Resort','Pokémon Red/Blue/Green','Elden Ring',
    'Pokémon Gold/Silver','Super Mario World','GTA: San Andreas','Call of Duty: Modern Warfare 3','Diablo III','New Super Mario Bros.','Pokémon Sword/Shield','Super Mario Odyssey','The Sims','Kinect Adventures!',
    'Nintendogs','Mario Kart DS','Pokémon Scarlet/Violet','Grand Theft Auto IV','Cyberpunk 2077','Sonic the Hedgehog','Duck Hunt','Super Mario Bros. 3','Pokémon Diamond/Pearl','Tetris (Game Boy)']},
  { id:'fastfood', name:'Fast Food Chains', emoji:'🍔', basis:'US sales (approx.)', items:[
    'McDonald\'s','Starbucks','Chick-fil-A','Taco Bell','Wendy\'s','Dunkin\'','Burger King','Subway','Chipotle','Domino\'s',
    'Sonic','Panera Bread','Popeyes','Pizza Hut','Raising Cane\'s','Dairy Queen','Panda Express','KFC','Arby\'s','Jack in the Box',
    'Little Caesars','Whataburger','Papa John\'s','Jersey Mike\'s','Wingstop','Culver\'s','Zaxby\'s','Five Guys','Hardee\'s','Carl\'s Jr.',
    'In-N-Out Burger','Bojangles','Krispy Kreme','Firehouse Subs','Del Taco','Shake Shack','Church\'s Chicken','Qdoba','Steak \'n Shake','Long John Silver\'s']},
  { id:'heroes', name:'Superheroes', emoji:'🦸', basis:'raw power level (our list)', items:[
    'Superman','Thor','Scarlet Witch','Doctor Strange','Wonder Woman','Captain Marvel','Hulk','The Flash','Green Lantern','Shazam',
    'Vision','Iron Man','Spider-Man','Wolverine','Black Panther','Batman','Captain America','Aquaman','Deadpool','Black Widow',
    'Martian Manhunter','Silver Surfer','Jean Grey','Doctor Manhattan','Supergirl','Ghost Rider','Storm','Professor X','Cyborg','Mister Fantastic',
    'Human Torch','Cyclops','Star-Lord','Ant-Man','Hawkeye','Daredevil','Green Arrow','Robin','Nightwing','Moon Knight']},
  { id:'rappers', name:'Rappers', emoji:'🎤', basis:'our GOAT list', items:[
    'Tupac','The Notorious B.I.G.','Eminem','Jay-Z','Kendrick Lamar','Nas','Lil Wayne','Kanye West','André 3000','Snoop Dogg',
    'Drake','J. Cole','Rakim','Ice Cube','Dr. Dre','Nicki Minaj','Lauryn Hill','50 Cent','Missy Elliott','Travis Scott',
    'LL Cool J','DMX','Busta Rhymes','Ludacris','Lil\' Kim','Method Man','Big Pun','Common','Q-Tip','Pusha T',
    'Tyler, the Creator','Future','Mac Miller','A$AP Rocky','Megan Thee Stallion','Cardi B','Dave','Stormzy','Skepta','Lil Baby']},
  { id:'anime', name:'Anime Power', emoji:'⚡', basis:'power level (our list)', items:[
    'Saitama','Goku','Vegeta','Monkey D. Luffy','Ryomen Sukuna','Satoru Gojo','Naruto Uzumaki','Sasuke Uchiha','Madara Uchiha','Ichigo Kurosaki',
    'Meruem','Eren Yeager','All Might','Itachi Uchiha','Levi Ackerman','Gon Freecss','Tanjiro Kamado','Edward Elric','Izuku Midoriya','Killua Zoldyck',
    'Rimuru Tempest','Sōsuke Aizen','Frieza','Gohan','Whitebeard','Mob','Kenpachi Zaraki','Roronoa Zoro','Kakashi Hatake','Jiraiya',
    'Hisoka','Asta','Natsu Dragneel','Yuji Itadori','Megumi Fushiguro','Sanji','Denji','Katsuki Bakugo','Shoto Todoroki','Mikasa Ackerman']},
  { id:'animals', name:'Animal Fight Club', emoji:'🦁', basis:'who wins in a fight (our list)', items:[
    'African Elephant','Hippopotamus','Rhinoceros','Polar Bear','Saltwater Crocodile','Grizzly Bear','Bengal Tiger','Lion','Cape Buffalo','Gorilla',
    'Green Anaconda','Jaguar','Moose','Komodo Dragon','Leopard','Gray Wolf','Kangaroo','Chimpanzee','Honey Badger','Ostrich',
    'American Bison','Walrus','Giraffe','Mountain Lion','Spotted Hyena','Black Bear','Wild Boar','Cheetah','Orangutan','Burmese Python',
    'Cassowary','Wolverine','Baboon','King Cobra','Coyote','Golden Eagle','Llama','Canada Goose','Raccoon','House Cat']},
  { id:'tv', name:'TV Shows', emoji:'📺', basis:'acclaim (our list)', items:[
    'Breaking Bad','The Sopranos','The Wire','Game of Thrones','Avatar: The Last Airbender','The Office','Better Call Saul','Friends','Seinfeld','The Simpsons',
    'Succession','Stranger Things','Chernobyl','The Last of Us','Sherlock','Peaky Blinders','Rick and Morty','True Detective','Squid Game','SpongeBob SquarePants',
    'Mad Men','Fargo','Twin Peaks','Black Mirror','The Crown','Arcane','The Boys','Ted Lasso','The Bear','Westworld',
    'Lost','Dexter','House of the Dragon','The Mandalorian','Parks and Recreation','Brooklyn Nine-Nine','Euphoria','Prison Break','How I Met Your Mother','Family Guy']},
  { id:'candy', name:'Candy', emoji:'🍬', basis:'popularity (our list)', items:[
    'Reese\'s Cups','M&M\'s','Snickers','Kit Kat','Twix','Hershey\'s Bar','Skittles','Sour Patch Kids','Starburst','Butterfinger',
    'Milky Way','Swedish Fish','Nerds','Twizzlers','3 Musketeers','Hershey\'s Kisses','Jolly Rancher','Airheads','Tootsie Roll','Candy Corn',
    'Almond Joy','Mounds','Baby Ruth','PayDay','Whoppers','Junior Mints','Dots','Laffy Taffy','Lemonheads','Mike and Ike',
    'Trolli Gummy Worms','Haribo Goldbears','Warheads','Pop Rocks','Ring Pop','Smarties','Life Savers','Hot Tamales','Heath Bar','Good & Plenty']},
  { id:'pizza', name:'Pizza Toppings', emoji:'🍕', basis:'popularity (approx.)', items:[
    'Pepperoni','Sausage','Mushrooms','Bacon','Extra Cheese','Onions','Green Peppers','Black Olives','Chicken','Ham',
    'Pineapple','Jalapeños','Spinach','Tomatoes','Ground Beef','Garlic','Banana Peppers','Basil','Artichokes','Anchovies',
    'Feta','Pesto','Ricotta','Buffalo Chicken','Meatballs','Prosciutto','Salami','Red Onion','Sun-Dried Tomatoes','Roasted Peppers',
    'Sweetcorn','Tuna','Egg','Broccoli','Goat Cheese','Hot Honey','Chorizo','Rocket','Prawns','Capers']},
  { id:'powers', name:'Superpowers', emoji:'🌀', basis:'usefulness (our list)', items:[
    'Reality Warping','Time Control','Telekinesis','Teleportation','Immortality','Healing Factor','Shapeshifting','Mind Reading','Flight','Super Speed',
    'Invisibility','Super Strength','Weather Control','Duplication','Force Fields','Elemental Control','X-Ray Vision','Talk to Animals','Breathe Underwater','Super Hearing',
    'Power Mimicry','Super Intelligence','Invulnerability','Precognition','Gravity Control','Portal Creation','Phasing','Technopathy','Luck Manipulation','Energy Blasts',
    'Heal Others','Necromancy','Illusions','Size Shifting','Plant Control','Wall Crawling','Stretching','Sonic Scream','Enhanced Senses','Night Vision']},
  { id:'ukpop', name:'UK Pop Stars', emoji:'🎶', basis:'UK chart success (our list)', items:[
    'Ed Sheeran','Adele','Harry Styles','Dua Lipa','Elton John','Robbie Williams','Spice Girls','One Direction','Little Mix','Lewis Capaldi',
    'Calvin Harris','George Michael','Sam Smith','Take That','Stormzy','Coldplay','Olly Murs','Jess Glynne','Raye','Anne-Marie',
    'Amy Winehouse','Oasis','Arctic Monkeys','George Ezra','Rita Ora','Jessie J','Ellie Goulding','Girls Aloud','Sugababes','Central Cee',
    'Charli XCX','Rag\'n\'Bone Man','James Arthur','Sam Fender','Tom Grennan','Becky Hill','Florence + The Machine','Zayn','Bastille','Mabel']},
  { id:'popsongs', name:'Pop Bangers', emoji:'🎧', basis:'UK chart weeks at #1 & sales (approx.)', items:[
    'Shape of You – Ed Sheeran','Blinding Lights – The Weeknd','Uptown Funk – Mark Ronson','Someone You Loved – Lewis Capaldi','One Dance – Drake','Happy – Pharrell','Despacito – Luis Fonsi','Rolling in the Deep – Adele','As It Was – Harry Styles','Wannabe – Spice Girls',
    'Bohemian Rhapsody – Queen','Flowers – Miley Cyrus','Levitating – Dua Lipa','Bad Guy – Billie Eilish','Mr. Brightside – The Killers','Shake It Off – Taylor Swift','Sweet Caroline – Neil Diamond','Murder on the Dancefloor – Sophie Ellis-Bextor','Espresso – Sabrina Carpenter','Dancing Queen – ABBA',
    'Billie Jean – Michael Jackson','Wonderwall – Oasis','Umbrella – Rihanna','Crazy in Love – Beyoncé','Bad Romance – Lady Gaga','Toxic – Britney Spears','Poker Face – Lady Gaga','Viva la Vida – Coldplay','Hey Jude – The Beatles','I Gotta Feeling – Black Eyed Peas',
    'Somebody That I Used to Know – Gotye','Call Me Maybe – Carly Rae Jepsen','Don\'t Start Now – Dua Lipa','Watermelon Sugar – Harry Styles','Running Up That Hill – Kate Bush','Hips Don\'t Lie – Shakira','Sorry – Justin Bieber','Cruel Summer – Taylor Swift','Livin\' on a Prayer – Bon Jovi','Party in the U.S.A. – Miley Cyrus']},
  { id:'ukrest', name:'UK Restaurant Chains', emoji:'🍽️', basis:'how good a night out it is (our list)', items:[
    'Nando\'s','Wagamama','Dishoom','Five Guys','Pizza Express','Franco Manca','Miller & Carter','Honest Burgers','Wahaca','Côte',
    'Gourmet Burger Kitchen','Zizzi','Bella Italia','Prezzo','TGI Fridays','Frankie & Benny\'s','Toby Carvery','Harvester','Wetherspoons','Pizza Hut',
    'Flat Iron','Pizza Pilgrims','Rosa\'s Thai','Turtle Bay','Las Iguanas','Bill\'s','Byron','Pho','Ask Italian','Yo! Sushi',
    'Café Rouge','Tortilla','Itsu','Slug & Lettuce','Wildwood','Chiquito','Beefeater','Brewers Fayre','Hungry Horse','Ember Inns']},
  { id:'ukfast', name:'UK Fast Food & Takeaway', emoji:'🍟', basis:'UK popularity (our list)', items:[
    'McDonald\'s','Greggs','KFC','Nando\'s','Domino\'s','Subway','Burger King','Chicken Shop','Chippy (Fish & Chips)','Pret A Manger',
    'Wingstop','Popeyes','Papa John\'s','Taco Bell','Leon','Kebab Shop','Indian Takeaway','Chinese Takeaway','Wimpy','Chopstix',
    'Five Guys','German Doner Kebab','Costa Coffee','Starbucks','Caffè Nero','Krispy Kreme','Morley\'s','Dixy Chicken','Sam\'s Chicken','Local Pizza Shop',
    'Shake Shack','Wendy\'s','Tortilla','Itsu','Upper Crust','Harry Ramsden\'s','Pieminister','West Cornwall Pasty Co.','Wasabi','Tim Hortons']},
  { id:'ukchoc', name:'UK Chocolate Bars', emoji:'🍫', basis:'UK popularity (our list)', items:[
    'Dairy Milk','Twix','Kinder Bueno','Galaxy','KitKat','Maltesers','Twirl','Wispa','Mars','Snickers',
    'Crunchie','Double Decker','Toffee Crisp','Boost','Lion Bar','Aero','Yorkie','Picnic','Fry\'s Chocolate Cream','Bounty',
    'Terry\'s Chocolate Orange','Ferrero Rocher','Lindt Lindor','Toblerone','Flake','Freddo','Milkybar','Buttons','Caramac','Curly Wurly',
    'Fudge','Starbar','Ripple','Galaxy Caramel','Timeout','Tunnock\'s Caramel Wafer','Turkish Delight','Topic','Milky Way','Penguin']},
  { id:'ukcrisps', name:'UK Crisps', emoji:'🥔', basis:'UK popularity (our list)', items:[
    'Walkers Cheese & Onion','Wotsits','Pringles Original','Monster Munch','Quavers','Doritos Chilli Heatwave','McCoy\'s Salt & Vinegar','Hula Hoops','Skips','Walkers Ready Salted',
    'Frazzles','Discos','Kettle Chips Sea Salt','Space Raiders','Squares','French Fries','Pom-Bears','Nik Naks','Twiglets','Walkers Prawn Cocktail',
    'Walkers Salt & Vinegar','Pringles Sour Cream & Onion','Doritos Cool Original','Sensations Thai Sweet Chilli','McCoy\'s Flame Grilled Steak','Kettle Chips Salt & Balsamic','Walkers Smoky Bacon','Mini Cheddars','Tyrrells','Scampi Fries',
    'Bacon Fries','Chipsticks','Wheat Crunchies','Seabrook','Golden Wonder','Cheetos','Hula Hoops BBQ Beef','Walkers Max','Popchips','Snack a Jacks']},
  { id:'ukshops', name:'UK Supermarkets', emoji:'🛒', basis:'UK market share (approx.)', items:[
    'Tesco','Sainsbury\'s','Asda','Aldi','Morrisons','Lidl','Co-op','Waitrose','Iceland','Marks & Spencer',
    'Ocado','Costco','Farmfoods','Spar','Booths','Budgens','Londis','Home Bargains','B&M','Heron Foods',
    'One Stop','Nisa','Costcutter','Premier','Jack\'s','Poundland','Mace','Amazon Fresh','Whole Foods Market','Planet Organic',
    'Sainsbury\'s Local','Tesco Express','Bargain Booze','Poundstretcher','Gopuff','Abel & Cole','Fortnum & Mason','Harrods Food Hall','Local Farm Shop','Corner Shop']},
  { id:'epl', name:'Premier League Clubs', emoji:'🏆', basis:'all-time Premier League points (approx.)', items:[
    'Manchester United','Arsenal','Chelsea','Liverpool','Tottenham Hotspur','Manchester City','Everton','Newcastle United','Aston Villa','West Ham United',
    'Southampton','Blackburn Rovers','Leicester City','Fulham','Crystal Palace','Middlesbrough','Bolton Wanderers','Sunderland','Leeds United','Brighton',
    'Stoke City','Wolves','West Brom','Portsmouth','Charlton Athletic','Bournemouth','Norwich City','Burnley','Wigan Athletic','Birmingham City',
    'Coventry City','Sheffield Wednesday','Watford','Swansea City','Nottingham Forest','Brentford','QPR','Wimbledon','Hull City','Derby County']},
  { id:'uktv', name:'British TV', emoji:'🫖', basis:'iconic-ness (our list)', items:[
    'Only Fools and Horses','The Office (UK)','Gavin & Stacey','Peaky Blinders','Doctor Who','Fawlty Towers','Line of Duty','The Inbetweeners','Love Island','Strictly Come Dancing',
    'The Great British Bake Off','Top Gear','Sherlock','EastEnders','Coronation Street','Blackadder','Fleabag','Peep Show','Downton Abbey','I\'m a Celebrity',
    'Dad\'s Army','Monty Python\'s Flying Circus','Yes Minister','Red Dwarf','Absolutely Fabulous','The Vicar of Dibley','The IT Crowd','Derry Girls','Happy Valley','Luther',
    'Bodyguard','Broadchurch','Skins','Taskmaster','Friday Night Dinner','Top Boy','Ghosts','Sex Education','Gogglebox','Mrs. Brown\'s Boys']},
];
