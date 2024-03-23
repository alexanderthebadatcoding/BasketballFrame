import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

// Function to fetch data from ESPN API
async function fetchESPNData(i: number) {
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
    const nextGame = events[i]; // Assuming the first event is the next game

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
    const formattedDayAndTime = () => {
      const today = new Date();
      if (gameTime.toDateString() === today.toDateString()) {
        return `Today ${gameTime.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          timeZone: "America/New_York",
        })} ET`;
      } else {
        return `${gameTime.toLocaleString("en-US", {
          weekday: "long",
          timeZone: "America/New_York",
        })} ${gameTime.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
          timeZone: "America/New_York",
        })}`;
      }
    };
    const gameDay = formattedDayAndTime();
    const homeTeamScore = nextGame.competitions[0].competitors[0].score;
    const awayTeamScore = nextGame.competitions[0].competitors[1].score;
    const gameState = nextGame.status.type.state;
    let clock;
    let oddsDetails = "";

    if (gameState === "pre") {
      // Extract odds details if available
      clock = gameDay;
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
      gameDay,
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
  browserLocation: "/",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.frame("/", (c) => {
  // const { buttonValue, status } = c;
  return c.res({
    action: "/0",
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
    intents: [<Button value="next">View Games</Button>],
  });
});
const games = await fetchESPNData(0);
for (let i = 0; i < games?.length; i++) {
  app.frame(`/${i}`, async (c) => {
    // const { buttonValue } = c;
    const espnData = await fetchESPNData(i);
    console.log(espnData);
    // Define the action for the "back" button
    let backAction = i > 0 ? `/${i - 1}` : `/`;
    // Define the action for the "next" button
    let nextAction = i < espnData?.length - 1 ? `/${i + 1}` : null;
    return c.res({
      // action: action,
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
              height={450}
              src={espnData?.homeTeamLogoUrl}
              style={{ margin: "0 50px" }}
              width={450}
            />
            <img
              alt="Away Team"
              height={450}
              src={espnData?.awayTeamLogoUrl}
              style={{ margin: "0 50px" }}
              width={450}
            />
          </div>

          {/* Conditionally render based on gameState */}
          {espnData?.gameState === "pre" ? (
            <>
              <div
                style={{
                  marginTop: 75,
                }}
              >
                {espnData?.oddsDetails}
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: 75,
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
        <Button value="back" action={backAction}>
          Back
        </Button>,
        nextAction ? (
          <Button value="next" action={nextAction}>
            Next
          </Button>
        ) : (
          <Button.Reset>Reset</Button.Reset>
        ),
      ].filter(Boolean),
    });
  });
}
if (import.meta.env?.MODE === "development") devtools(app, { serveStatic });
else devtools(app, { assetsPath: "/.frog" });

export const GET = handle(app);
export const POST = handle(app);
