import { useEffect } from "react";
import { useLocation } from "react-router-dom";
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

