import { prisma } from './prisma';

export async function getAverageRatingsMap(albumIds?: string[]): Promise<Record<string, number>> {
  try {
    const where = albumIds ? { albumId: { in: albumIds } } : {};
    const groupedReviews = await prisma.review.groupBy({
      by: ['albumId'],
      _avg: { rating: true },
      where,
    });
    return groupedReviews.reduce((acc, review) => {
      if (review._avg.rating) {
        acc[review.albumId] = review._avg.rating;
      }
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error("Error en getAverageRatingsMap:", error);
    return {};
  }
}
