import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { logsApi } from '../../api/logs';
import { tvApi } from '../../api/tv';
import { resolveGenreName } from '../../lib/genreName';
import { posterUrl } from '../../lib/tmdbImage';

type MediaType = 'movie' | 'tv';

interface UnifiedItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  rating: number | null;
  collectionId: number | null;
  collectionName: string | null;
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  rating: number | null;
  clusterId: number;
}

interface CollectionEdge {
  source: string;
  target: string;
  label: string;
}

interface Cluster {
  id: number;
  genreId: number;
  name: string;
  color: string;
  count: number;
  cx: number;
  cy: number;
}

const WIDTH = 960;
const HEIGHT = 640;
const NODE_RADIUS = 26;

const CLUSTER_COLORS = ['#1e6e63', '#b45309', '#6d28d9', '#be123c', '#0369a1', '#4d7c0f', '#a16207', '#9d174d', '#0e7490', '#7c2d12'];

export function MovieMap() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<CollectionEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set());
  const [minRating, setMinRating] = useState(0);

  const { data: movieLogs, isLoading: movieLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsApi.list(),
  });

  const { data: tvLogs, isLoading: tvLoading } = useQuery({
    queryKey: ['tv-logs'],
    queryFn: () => tvApi.logs.list(),
  });

  const isLoading = movieLoading || tvLoading;

  // dedupe logs into one item per tmdbId+mediaType (a title may be logged more than once)
  const allItems = useMemo<UnifiedItem[]>(() => {
    const byId = new Map<string, UnifiedItem>();
    for (const log of movieLogs ?? []) {
      const key = `movie-${log.tmdb_id}`;
      if (!byId.has(key)) {
        byId.set(key, {
          tmdbId: log.tmdb_id,
          mediaType: 'movie',
          title: log.title,
          posterPath: log.poster_path,
          genreIds: log.genre_ids ?? [],
          rating: log.rating,
          collectionId: log.collection_id,
          collectionName: log.collection_name,
        });
      }
    }
    for (const log of tvLogs ?? []) {
      const key = `tv-${log.tmdb_id}`;
      if (!byId.has(key)) {
        byId.set(key, {
          tmdbId: log.tmdb_id,
          mediaType: 'tv',
          title: log.name,
          posterPath: log.poster_path,
          genreIds: log.genre_ids ?? [],
          rating: log.rating,
          collectionId: null,
          collectionName: null,
        });
      }
    }
    return [...byId.values()];
  }, [movieLogs, tvLogs]);

  const availableGenres = useMemo(() => {
    const ids = new Set<number>();
    for (const m of allItems) for (const g of m.genreIds) ids.add(g);
    return [...ids].sort((a, b) => resolveGenreName(a).localeCompare(resolveGenreName(b), 'tr'));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((m) => {
      if ((m.rating ?? 0) < minRating) return false;
      if (selectedGenres.size > 0 && !m.genreIds.some((g) => selectedGenres.has(g))) return false;
      return true;
    });
  }, [allItems, minRating, selectedGenres]);

  // Data-driven clustering: each item's category is the genre that is most
  // common across the user's own filtered collection (no hardcoded/fake groups).
  const { clusters, nodes, edges } = useMemo(() => {
    if (filteredItems.length === 0) return { clusters: [] as Cluster[], nodes: [] as GraphNode[], edges: [] as CollectionEdge[] };

    const genreFrequency = new Map<number, number>();
    for (const m of filteredItems) {
      for (const g of m.genreIds) {
        genreFrequency.set(g, (genreFrequency.get(g) ?? 0) + 1);
      }
    }

    function dominantGenre(genreIds: number[]): number {
      if (genreIds.length === 0) return -1;
      return [...genreIds].sort((a, b) => (genreFrequency.get(b) ?? 0) - (genreFrequency.get(a) ?? 0) || a - b)[0];
    }

    const itemCluster = new Map<string, number>(); // "mediaType-tmdbId" -> genreId
    for (const m of filteredItems) {
      itemCluster.set(`${m.mediaType}-${m.tmdbId}`, dominantGenre(m.genreIds));
    }

    const genreCounts = new Map<number, number>();
    for (const genreId of itemCluster.values()) {
      genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
    }

    const orderedGenreIds = [...genreCounts.keys()].sort((a, b) => (genreCounts.get(b) ?? 0) - (genreCounts.get(a) ?? 0) || a - b);

    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const ringRadius = orderedGenreIds.length <= 1 ? 0 : Math.min(WIDTH, HEIGHT) * 0.32;

    const clusters: Cluster[] = orderedGenreIds.map((genreId, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / orderedGenreIds.length;
      return {
        id: i,
        genreId,
        name: genreId === -1 ? 'Diğer' : resolveGenreName(genreId),
        color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
        count: genreCounts.get(genreId) ?? 0,
        cx: centerX + ringRadius * Math.cos(angle),
        cy: centerY + ringRadius * Math.sin(angle),
      };
    });

    const clusterIndexByGenre = new Map(clusters.map((c) => [c.genreId, c.id]));

    const nodes: GraphNode[] = filteredItems.map((m) => ({
      id: `${m.mediaType}-${m.tmdbId}`,
      tmdbId: m.tmdbId,
      mediaType: m.mediaType,
      title: m.title,
      posterPath: m.posterPath,
      rating: m.rating,
      clusterId: clusterIndexByGenre.get(itemCluster.get(`${m.mediaType}-${m.tmdbId}`) ?? -1) ?? 0,
    }));

    // Sequel/franchise links only exist for movies (tv_shows has no collection concept in this schema)
    const edges: CollectionEdge[] = [];
    for (let i = 0; i < filteredItems.length; i++) {
      for (let j = i + 1; j < filteredItems.length; j++) {
        const a = filteredItems[i];
        const b = filteredItems[j];
        if (a.collectionId && a.collectionId === b.collectionId) {
          edges.push({
            source: `${a.mediaType}-${a.tmdbId}`,
            target: `${b.mediaType}-${b.tmdbId}`,
            label: a.collectionName ?? 'Seri',
          });
        }
      }
    }

    return { clusters, nodes, edges };
  }, [filteredItems]);

  useEffect(() => {
    if (nodes.length === 0) {
      nodesRef.current = [];
      edgesRef.current = [];
      setTick((t) => t + 1);
      return;
    }

    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges.map((e) => ({ ...e }));
    const clusterById = new Map(clusters.map((c) => [c.id, c]));

    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simEdges as never)
          .id((d) => (d as GraphNode).id)
          .distance(70)
          .strength(0.9),
      )
      .force('charge', forceManyBody().strength(-90))
      .force('collide', forceCollide(NODE_RADIUS + 8))
      .force('x', forceX<GraphNode>((d) => clusterById.get(d.clusterId)?.cx ?? WIDTH / 2).strength(0.12))
      .force('y', forceY<GraphNode>((d) => clusterById.get(d.clusterId)?.cy ?? HEIGHT / 2).strength(0.12))
      .on('tick', () => {
        nodesRef.current = simNodes as GraphNode[];
        edgesRef.current = simEdges as unknown as CollectionEdge[];
        setTick((t) => t + 1);
      });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, clusters]);

  function toggleGenre(genreId: number) {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genreId)) next.delete(genreId);
      else next.add(genreId);
      return next;
    });
  }

  if (isLoading) {
    return <p className="text-text-muted text-center mt-12">Yükleniyor...</p>;
  }

  const totalLogs = (movieLogs?.length ?? 0) + (tvLogs?.length ?? 0);
  if (totalLogs < 2) {
    return (
      <p className="text-text-muted text-center mt-12">
        Harita için en az 2 film/dizi loglamanız gerekiyor.
      </p>
    );
  }

  const renderedNodes = nodesRef.current;
  const renderedEdges = edgesRef.current;

  return (
    <div>
      <h1 className="text-xl font-semibold text-highlight mb-2">Film ve Dizi Haritası</h1>
      <p className="text-sm text-text-muted mb-4">
        Kategoriler kendi loglarınızdaki türlerin sıklığına göre otomatik oluşturulur. Çizgiler aynı seriye ait devam filmlerini gösterir.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-start">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">Minimum puanım: {minRating || 'Hepsi'}</label>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs text-text-muted">Türe göre filtrele</label>
          <div className="flex flex-wrap gap-1.5">
            {availableGenres.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  selectedGenres.has(g)
                    ? 'bg-highlight text-base border-highlight'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {resolveGenreName(g)}
              </button>
            ))}
            {selectedGenres.size > 0 && (
              <button onClick={() => setSelectedGenres(new Set())} className="px-2 py-0.5 text-xs text-text-muted underline">
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="text-text-muted text-center mt-12">Bu filtrelere uyan film/dizi yok.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT}>
            <defs>
              {renderedNodes.map((node) => (
                <clipPath id={`clip-${node.id}`} key={node.id}>
                  <circle r={NODE_RADIUS} />
                </clipPath>
              ))}
            </defs>

            {clusters.map((cluster) => (
              <g key={cluster.id}>
                <circle cx={cluster.cx} cy={cluster.cy} r={90} fill={cluster.color} opacity={0.08} />
                <text x={cluster.cx} y={cluster.cy - 95} textAnchor="middle" fontSize={13} fontWeight={600} fill={cluster.color}>
                  {cluster.name} ({cluster.count})
                </text>
              </g>
            ))}

            {renderedEdges.map((edge, i) => {
              const source = edge.source as unknown as GraphNode;
              const target = edge.target as unknown as GraphNode;
              if (source?.x == null || target?.x == null) return null;
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#1e6e63"
                  strokeWidth={3}
                />
              );
            })}

            {renderedNodes.map((node) => {
              const src = posterUrl(node.posterPath, 'w200');
              const cluster = clusters[node.clusterId];
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
                  onClick={() => navigate(node.mediaType === 'tv' ? `/tv/${node.tmdbId}` : `/movie/${node.tmdbId}`)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r={NODE_RADIUS + 3} fill={cluster?.color ?? '#1e6e63'} />
                  {src ? (
                    <image
                      href={src}
                      x={-NODE_RADIUS}
                      y={-NODE_RADIUS}
                      width={NODE_RADIUS * 2}
                      height={NODE_RADIUS * 2}
                      clipPath={`url(#clip-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <circle r={NODE_RADIUS} fill="#334155" />
                  )}
                  {node.rating != null && (
                    <>
                      <circle cx={NODE_RADIUS - 4} cy={NODE_RADIUS - 4} r={11} fill="#0f172a" stroke={cluster?.color ?? '#1e6e63'} />
                      <text x={NODE_RADIUS - 4} y={NODE_RADIUS - 1} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
                        {(node.rating / 2).toFixed(1)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {hoveredNode && (
        <p className="text-xs text-text-muted mt-2">
          {hoveredNode.title} {hoveredNode.mediaType === 'tv' ? '(Dizi)' : '(Film)'}
        </p>
      )}
    </div>
  );
}
