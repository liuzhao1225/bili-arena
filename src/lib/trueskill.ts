import { Rating, rate_1vs1 } from "ts-trueskill";

export const DEFAULT_MU = 25;
export const DEFAULT_SIGMA = 25 / 3;

export function createRating(mu = DEFAULT_MU, sigma = DEFAULT_SIGMA): Rating {
  return new Rating(mu, sigma);
}

export function rankScore(mu: number, sigma: number): number {
  return mu - 3 * sigma;
}

export function updateRatings1v1(
  winnerMu: number,
  winnerSigma: number,
  loserMu: number,
  loserSigma: number
): [[number, number], [number, number]] {
  const winner = new Rating(winnerMu, winnerSigma);
  const loser = new Rating(loserMu, loserSigma);
  const [newWinner, newLoser] = rate_1vs1(winner, loser);
  return [
    [newWinner.mu, newWinner.sigma],
    [newLoser.mu, newLoser.sigma],
  ];
}

export function updateRatings1v1Draw(
  mu1: number,
  sigma1: number,
  mu2: number,
  sigma2: number
): [[number, number], [number, number]] {
  const r1 = new Rating(mu1, sigma1);
  const r2 = new Rating(mu2, sigma2);
  const [new1, new2] = rate_1vs1(r1, r2, true);
  return [
    [new1.mu, new1.sigma],
    [new2.mu, new2.sigma],
  ];
}
