import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MoneyPathDetailScreen } from "../../../components/demo-case/money-path-detail-screen";
import { syntheticCase } from "../../../data/synthetic-case";
import { formatCurrency } from "../../../presentation/format";

type MoneyPathPageProps = {
  params: Promise<{ pathId: string }>;
};

function getMoneyPath(pathId: string) {
  return syntheticCase.moneyPaths.find((path) => path.id === pathId);
}

export function generateStaticParams() {
  return syntheticCase.moneyPaths.map((path) => ({ pathId: path.id }));
}

export async function generateMetadata({ params }: MoneyPathPageProps): Promise<Metadata> {
  const { pathId } = await params;
  const path = getMoneyPath(pathId);
  return { title: path ? `${formatCurrency(path.amount)} money path` : "Money path not found" };
}

export default async function MoneyPathPage({ params }: MoneyPathPageProps) {
  const { pathId } = await params;
  const path = getMoneyPath(pathId);
  if (!path) notFound();

  return <MoneyPathDetailScreen moneyPathId={path.id} />;
}
