import Storefront from '@/app/storefront';
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Storefront slug={slug}/>}
