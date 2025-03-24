import Link from 'next/link';

const NavBar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-indigo-600 text-xl font-bold">
            LABLENS
          </Link>
          <div className="space-x-6">
          
            <Link href="/analyse" className="text-gray-600 hover:text-indigo-600">
              Analyse
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-indigo-600">
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;