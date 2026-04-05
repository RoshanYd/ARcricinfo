import { Tournament, TournamentFixture, PointsTableEntry, TournamentFormat, Match } from '../types';

// ─── Fixture Generation ───────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function knockoutRoundLabel(round: number, totalTeams: number): string {
    const matchesInRound = totalTeams / Math.pow(2, round);
    if (matchesInRound === 1) return 'Final';
    if (matchesInRound === 2) return 'Semi-Final';
    if (matchesInRound === 4) return 'Quarter-Final';
    return `Round ${round}`;
}

/** Generate Round 1 knockout fixtures from team list */
export function generateKnockoutFixtures(teams: string[]): TournamentFixture[] {
    const shuffled = shuffleArray(teams);
    const fixtures: TournamentFixture[] = [];
    const label = knockoutRoundLabel(1, teams.length);
    for (let i = 0; i < shuffled.length; i += 2) {
        fixtures.push({
            id: crypto.randomUUID(),
            round: 1,
            label: `${label} ${Math.floor(i / 2) + 1}`,
            team1: shuffled[i],
            team2: shuffled[i + 1] ?? 'TBD',
            status: 'PENDING',
        });
    }
    return fixtures;
}

/** Generate all league (round-robin) fixtures */
export function generateLeagueFixtures(teams: string[]): TournamentFixture[] {
    const fixtures: TournamentFixture[] = [];
    let matchNum = 1;
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            fixtures.push({
                id: crypto.randomUUID(),
                round: 1,
                label: `Match ${matchNum++}`,
                team1: teams[i],
                team2: teams[j],
                status: 'PENDING',
            });
        }
    }
    return fixtures;
}

/** Initialize points table for all teams */
export function initPointsTable(teams: string[]): PointsTableEntry[] {
    return teams.map(t => ({
        teamName: t,
        played: 0, won: 0, lost: 0, tied: 0, noResult: 0,
        points: 0, runsFor: 0, runsAgainst: 0, ballsFor: 0, ballsAgainst: 0, nrr: 0,
    }));
}

// ─── Tournament Progression ───────────────────────────────────────────────────

/** Called after a tournament match completes. Returns updated tournament. */
export function processMatchResult(tournament: Tournament, completedMatch: Match): Tournament {
    const t = JSON.parse(JSON.stringify(tournament)) as Tournament; // deep clone

    // Find the fixture this match belongs to
    const fixture = t.fixtures.find(f => f.matchId === completedMatch.id);
    if (!fixture) return t;

    const winnerName = completedMatch.winningTeamId
        ? (completedMatch.winningTeamId === completedMatch.teamA.id ? completedMatch.teamA.name : completedMatch.teamB.name)
        : undefined;

    const score = (team: typeof completedMatch.teamA) =>
        `${team.totalRuns}/${team.wickets} (${Math.floor(team.overs / 6)}.${team.overs % 6})`;

    fixture.status = 'COMPLETED';
    fixture.winner = winnerName;
    fixture.team1Score = score(completedMatch.teamA.name === fixture.team1 ? completedMatch.teamA : completedMatch.teamB);
    fixture.team2Score = score(completedMatch.teamA.name === fixture.team2 ? completedMatch.teamA : completedMatch.teamB);

    // Update points table (League)
    if (t.format === 'LEAGUE') {
        const updateEntry = (teamName: string, matchTeam: typeof completedMatch.teamA, oppTeam: typeof completedMatch.teamA) => {
            const entry = t.pointsTable.find(e => e.teamName === teamName);
            if (!entry) return;
            entry.played += 1;
            entry.runsFor += matchTeam.totalRuns;
            entry.ballsFor += matchTeam.overs;
            entry.runsAgainst += oppTeam.totalRuns;
            entry.ballsAgainst += oppTeam.overs;
            if (!completedMatch.winningTeamId) {
                entry.tied += 1; entry.points += 1;
            } else if (winnerName === teamName) {
                entry.won += 1; entry.points += 2;
            } else {
                entry.lost += 1;
            }
            const oversFor = entry.ballsFor > 0 ? entry.ballsFor / 6 : 0.001;
            const oversAgainst = entry.ballsAgainst > 0 ? entry.ballsAgainst / 6 : 0.001;
            entry.nrr = parseFloat((entry.runsFor / oversFor - entry.runsAgainst / oversAgainst).toFixed(3));
        };

        updateEntry(completedMatch.teamA.name, completedMatch.teamA, completedMatch.teamB);
        updateEntry(completedMatch.teamB.name, completedMatch.teamB, completedMatch.teamA);

        // Sort: points desc, NRR desc
        t.pointsTable.sort((a, b) => b.points - a.points || b.nrr - a.nrr);

        // Check if all league fixtures done → declare champion
        const allDone = t.fixtures.every(f => f.status === 'COMPLETED');
        if (allDone) {
            t.status = 'COMPLETED';
            t.champion = t.pointsTable[0]?.teamName;
        }
    }

    // Knockout progression
    if (t.format === 'KNOCKOUT' && winnerName) {
        const currentRoundFixtures = t.fixtures.filter(f => f.round === fixture.round);
        const allRoundDone = currentRoundFixtures.every(f => f.status === 'COMPLETED');

        if (allRoundDone) {
            const winners = currentRoundFixtures.map(f => f.winner!).filter(Boolean);
            if (winners.length === 1) {
                // Only one winner → champion
                t.status = 'COMPLETED';
                t.champion = winners[0];
            } else {
                // Generate next round fixtures
                const nextRound = fixture.round + 1;
                const label = knockoutRoundLabel(nextRound, t.teams.length);
                for (let i = 0; i < winners.length; i += 2) {
                    t.fixtures.push({
                        id: crypto.randomUUID(),
                        round: nextRound,
                        label: `${label} ${Math.floor(i / 2) + 1}`,
                        team1: winners[i],
                        team2: winners[i + 1] ?? 'TBD',
                        status: 'PENDING',
                    });
                }
                t.currentRound = nextRound;
            }
        }
    }

    return t;
}
