import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { shopApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search, ShoppingCart, Heart, Package, Star, Loader2, Zap,
  ArrowRight, ChevronDown, Tag, TrendingUp, Shield, Truck
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export default function Shop() {
  const [search, setSearch]              = useState('');
  const [selectedCategory, setCategory] = useState('');
  const [sortBy, setSortBy]             = useState('newest');
  const [wishlist, setWishlist]         = useState<string[]>([]);
  const qc = useQueryClient();

  const { data: cartData } = useQuery({ queryKey:['cart'], queryFn:()=>shopApi.getCart() });
  const cartItems = cartData?.data?.data?.items || [];
  const cartCount = cartItems.reduce((a:number,i:any)=>a+i.qty,0);

  const addToCartMutation = useMutation({
    mutationFn: ({productId,qty}:{productId:string;qty:number}) => shopApi.addToCart(productId,qty),
    onSuccess: () => { qc.invalidateQueries({queryKey:['cart']}); toast.success('Added to cart!'); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shop-products',search,selectedCategory,sortBy],
    queryFn: () => shopApi.getProducts({search,category:selectedCategory,sort:sortBy}),
    staleTime: 3*60*1000,
  });
  const { data: catsData } = useQuery({ queryKey:['shop-categories'], queryFn:()=>shopApi.getCategories(), staleTime:10*60*1000 });

  const products   = data?.data?.data?.products || [];
  const categories = catsData?.data?.data?.categories || [];

  function toggleWish(id:string) {
    setWishlist(prev => prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
    toast.success(wishlist.includes(id)?'Removed from wishlist':'Added to wishlist');
  }

  const FEATURES = [
    { Icon:Truck,   label:'Free Delivery', desc:'On orders over ৳999' },
    { Icon:Shield,  label:'Secure Payment',desc:'100% protected transactions' },
    { Icon:TrendingUp, label:'Best Prices', desc:'Guaranteed lowest prices' },
    { Icon:Tag,     label:'Easy Returns',  desc:'30-day hassle-free returns' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Hero */}
      <section className="relative overflow-hidden py-14 lg:py-24"
        style={{background:'linear-gradient(135deg,#020617 0%,#0d1f2d 60%,#0a7569 100%)'}}>
        <div className="absolute inset-0" style={{background:'radial-gradient(circle at 70% 50%,rgba(10,117,105,0.25),transparent 60%)'}}/>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="h-3 w-3 text-yellow-400"/>New Arrivals 2026
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white mb-5 leading-tight">
              Premium Products<br/>
              <span style={{color:'#0a7569'}} className="drop-shadow-lg">For Your Business</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed max-w-lg">
              Discover quality products from verified vendors. Fast delivery, secure payments, easy returns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-12 px-8 font-bold bg-white text-[#020617] hover:bg-white/90 shadow-xl">
                Shop Now <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 font-bold border-white/30 text-white hover:bg-white/10">
                View Deals
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {FEATURES.map(f=>(
              <div key={f.label} className="flex items-center gap-3 py-4 px-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.Icon className="h-5 w-5 text-primary"/>
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/shop" className="text-xl font-black text-[#020617] flex-shrink-0">
            BizHub<span style={{color:'#0a7569'}}>Shop</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-5">
            {['All Products','Trending','New Arrivals','Deals'].map(n=>(
              <Link key={n} to="/shop" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{n}</Link>
            ))}
          </nav>
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search products…" className="pl-9 bg-slate-100 border-none h-9" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground relative">
              <Heart className="h-5 w-5"/>
              {wishlist.length>0&&<span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{wishlist.length}</span>}
            </Button>
            <Link to="/cart">
              <Button className="relative gap-2 h-9 font-semibold" style={{background:'#020617'}}>
                <ShoppingCart className="h-4 w-4"/>
                <span className="hidden sm:inline">Cart</span>
                {cartCount>0&&<span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">{cartCount}</span>}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile search */}
        <div className="mb-4 md:hidden relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search products…" className="pl-9" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {[{_id:'',name:{en:'All Products'}},...categories].map((cat:any)=>(
            <button key={cat._id} onClick={()=>setCategory(cat._id)}
              className={cn('px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0',
                selectedCategory===cat._id
                  ?'border-transparent text-white shadow-lg shadow-primary/20'
                  :'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary'
              )}
              style={selectedCategory===cat._id?{background:'#020617'}:{}}>
              {cat.name?.en||cat.name}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{products.length}</span> products
          </p>
          <select className="h-9 text-sm border rounded-lg px-3 bg-white" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_,i)=><div key={i} className="h-80 bg-slate-200 animate-pulse rounded-2xl"/>)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Package className="h-16 w-16 text-slate-300 mb-4"/>
            <p className="font-semibold text-slate-600">No products found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or category</p>
            <Button variant="link" className="text-primary mt-2" onClick={()=>{setCategory('');setSearch('');}}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product:any)=>(
              <div key={product._id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                {/* Image */}
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {product.pricing?.mrp > product.pricing?.sellingPrice && (
                    <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg shadow">
                      {Math.round((1-product.pricing.sellingPrice/product.pricing.mrp)*100)}% OFF
                    </div>
                  )}
                  <button
                    className={cn('absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all',
                      wishlist.includes(product._id)?'bg-red-500 text-white':'bg-white text-slate-400 opacity-0 group-hover:opacity-100')}
                    onClick={()=>toggleWish(product._id)}>
                    <Heart className={cn('h-4 w-4', wishlist.includes(product._id)&&'fill-white')}/>
                  </button>
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name?.en} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-14 w-14 text-slate-300"/>
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
                    {product.category?.name?.en||'General'}
                  </p>
                  <h3 className="font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-primary transition-colors text-sm">
                    {product.name?.en||product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_,i)=>(
                      <Star key={i} className={cn('h-3 w-3',i<4?'fill-amber-400 text-amber-400':'text-slate-200')}/>
                    ))}
                    <span className="text-[10px] text-slate-400 ml-1">(24)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg text-slate-900">{formatCurrency(product.pricing?.sellingPrice||0)}</p>
                      {product.pricing?.mrp>product.pricing?.sellingPrice&&(
                        <p className="text-xs text-slate-400 line-through">{formatCurrency(product.pricing.mrp)}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-9 w-9 rounded-xl p-0 shadow-md shadow-primary/20"
                      onClick={()=>addToCartMutation.mutate({productId:product._id,qty:1})}
                      disabled={addToCartMutation.isPending}
                      style={{background:'#0a7569'}}>
                      {addToCartMutation.isPending
                        ?<Loader2 className="h-4 w-4 animate-spin"/>
                        :<ShoppingCart className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter */}
      <section className="bg-white border-t mt-16 py-16">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Stay Updated</h2>
          <p className="text-slate-500 mb-6">Get the latest products and exclusive offers in your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Enter your email…" className="h-11 bg-slate-50 border-slate-200 flex-1"/>
            <Button className="h-11 px-7 font-bold" style={{background:'#020617'}}>Subscribe</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'#020617'}} className="text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <p className="text-xl font-black mb-4">BizHub<span style={{color:'#0a7569'}}>Shop</span></p>
              <p className="text-white/50 text-sm leading-relaxed">
                The ultimate ERP & E-commerce platform for modern businesses.
              </p>
            </div>
            {[
              {title:'Shop',  links:['All Products','Trending','New Arrivals']},
              {title:'Support',links:['Contact Us','Shipping Policy','Refunds']},
              {title:'Business',links:['Sell on BizHub','Merchant Portal']},
            ].map(col=>(
              <div key={col.title}>
                <h4 className="font-bold text-xs uppercase tracking-widest text-white/40 mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(l=><li key={l}><Link to="/shop" className="text-sm text-white/60 hover:text-white transition-colors">{l}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/30 text-xs">
            © 2026 BizHub ERP &amp; POS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}