import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }
// Function to fetch data from ESPN API
async function fetchESPNData() {
  try {
    const response = await fetch(
      "http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard"
    );
    const data = await response.json();
    // Use ESPN data to populate the frame
    // Extract information about the next game
    const events = data.events;
    const length = events.length;
    // const randomIndex = Math.floor(Math.random() * length);
    const nextGame = events[0]; // Assuming the first event is the next game

    // Extract relevant information
    const homeTeamData = nextGame.competitions[0].competitors[0].team;
    const awayTeamData = nextGame.competitions[0].competitors[1].team;
    const homeTeamLogoUrl = homeTeamData.logo;
    const awayTeamLogoUrl = awayTeamData.logo;
    const homeTeam = homeTeamData.shortDisplayName;
    const awayTeam = awayTeamData.shortDisplayName;
    // const homeTeamAlt = homeTeamData.alternateColor;
    const homeTeamColor = homeTeamData.color;
    let awayTeamColor = awayTeamData.color;
    const awayTeamAlt = awayTeamData.alternateColor;
    if (awayTeamColor === "ffffff") {
      awayTeamColor = awayTeamAlt;
    }

    let broadcastName = "";
    if (
      nextGame &&
      nextGame.competitions &&
      nextGame.competitions[0] &&
      nextGame.competitions[0].broadcasts &&
      nextGame.competitions[0].broadcasts[0] &&
      nextGame.competitions[0].broadcasts[0].names &&
      nextGame.competitions[0].broadcasts[0].names.length > 0
    ) {
      broadcastName = nextGame.competitions[0].broadcasts[0].names[0];
    }

    const gameTime = new Date(nextGame.date);
    const homeTeamScore = nextGame.competitions[0].competitors[0].score;
    const awayTeamScore = nextGame.competitions[0].competitors[1].score;
    const gameState = nextGame.status.type.state;
    let clock;
    let oddsDetails = "";

    if (gameState === "pre") {
      // Extract odds details if available
      clock = new Date(nextGame.date);
      if (
        nextGame &&
        nextGame.competitions &&
        nextGame.competitions[0] &&
        nextGame.competitions[0].odds &&
        nextGame.competitions[0].odds[0]
      ) {
        oddsDetails = nextGame.competitions[0].odds[0].details;
      }
    } else {
      clock = nextGame.status.type.detail;
    }
    return {
      length,
      homeTeam,
      awayTeam,
      homeTeamLogoUrl,
      awayTeamLogoUrl,
      homeTeamColor,
      awayTeamColor,
      broadcastName,
      gameTime,
      homeTeamScore,
      awayTeamScore,
      gameState,
      oddsDetails,
      clock,
    };
  } catch (error) {
    console.error("Error fetching ESPN data:", error);
    return null;
  }
}

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.frame("/", (c) => {
  // const { buttonValue, status } = c;
  return c.res({
    action: "/1",
    image: (
      <div
        style={{
          alignItems: "center",
          background: "#009CDE",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 100,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
            fontWeight: "bold",
          }}
        >
          NCAA March Madness in a Frame
        </div>
      </div>
    ),
    intents: [<Button value="next">Next</Button>],
  });
});

app.frame("/1", async (c) => {
  // const { buttonValue, status } = c;
  const espnData = await fetchESPNData();
  console.log(espnData);
  return c.res({
    action: "/2",
    image: (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(to right, #${espnData?.homeTeamColor}, #${espnData?.awayTeamColor})`,
          fontSize: 54,
          fontWeight: 600,
          color: "white",
        }}
      >
        <div style={{ marginBottom: 85 }}>{espnData?.clock}</div>
        <div
          style={{
            height: "40%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <img
            alt="Home Team"
            height={500}
            src={espnData?.homeTeamLogoUrl}
            style={{ margin: "0 50px" }}
            width={500}
          />
          <img
            alt="Away Team"
            height={500}
            src={espnData?.awayTeamLogoUrl}
            style={{ margin: "0 50px" }}
            width={500}
          />
        </div>

        {/* Conditionally render based on gameState */}
        {espnData?.gameState === "pre" ? (
          <>
            <div>{espnData?.oddsDetails}</div>
          </>
        ) : (
          <div
            style={{
              marginTop: 65,
              display: "flex",
              flexDirection: "row",
              width: "35%",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 60,
            }}
          >
            <div>{espnData?.homeTeamScore}</div>
            <div>{espnData?.awayTeamScore}</div>
          </div>
        )}
      </div>
    ),
    intents: [
      <Button value="refresh">Refresh</Button>,
      <Button value="next">Next</Button>,
    ],
  });
});
app.frame("/2", (c) => {
  // const { buttonValue, status } = c;
  return c.res({
    action: "/",
    image: (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(to right, #00205c, #ee8601)",
          fontSize: 54,
          fontWeight: 600,
          color: "white",
        }}
      >
        <div style={{ marginBottom: 85 }}>Today 7:00 pm</div>

        <div
          style={{
            height: "40%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <img
            alt="Team"
            height={500}
            src="https://a.espncdn.com/i/teamlogos/ncaa/500/147.png"
            style={{ margin: "0 40px" }}
            width={500}
          />
          <img
            alt="Vercel"
            height={500}
            src="https://a.espncdn.com/i/teamlogos/ncaa/500/2755.png"
            style={{ margin: "0 50px" }}
            width={500}
          />
        </div>
        <div style={{ marginTop: 80 }}>MTST -4.5</div>
      </div>
    ),
    intents: [
      <Button value="next">Back</Button>,
      <Button value="#">Refresh</Button>,
      <Button value="mango">Mango</Button>,
    ],
  });
});
if (import.meta.env?.MODE === "development") devtools(app, { serveStatic });
else devtools(app, { assetsPath: "/.frog" });

export const GET = handle(app);
export const POST = handle(app);
