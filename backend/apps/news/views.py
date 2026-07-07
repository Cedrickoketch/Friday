import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

NEWS_API_BASE = "https://newsapi.org/v2"


class NewsView(APIView):
    """Fetch top headlines. Free tier gets headlines only; Pro/Premium get full articles."""

    def get(self, request):
        category = request.query_params.get("category", "general").lower()
        country = request.query_params.get("country", "us").lower()
        country_mapping = {
            'usa': 'us',
            'us': 'us',
            'uk': 'gb',
            'united kingdom': 'gb',
            'south africa': 'za',
            'za': 'za',
            'kenya': 'ke',
            'ke': 'ke'
        }
        target_country = country_mapping.get(country, 'us') 

        if target_country == 'ke':
            url = f"{NEWS_API_BASE}/everything"
            kenyan_domains = "nation.africa,standardmedia.co.ke,the-star.co.ke,citizen.digital,capitalfm.co.ke"
            query_string = f"Kenya AND {category}" if category != "general" else "Kenya"
            params = {
                "qInTitle": query_string,
                "language": "en",
                "sortBy": "publishedAt",
                "apiKey": settings.NEWS_API_KEY
            }
        else:
            # Native endpoint execution for supported countries (us, gb, za)
            url = f"{NEWS_API_BASE}/top-headlines"
            params = {
                "country": target_country,
                "category": category,
                "apiKey": settings.NEWS_API_KEY
            }

        try:
            headers = {
                "User-Agent": "FridayProject/1.0 (My Personal AI Assistant App)"
            }
            
            # Print parameters to verify they look correct before firing
            print(f"DEBUG FETCHING NEWS -> Target URL: {url} | Params: {params}")
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            data = response.json()
            
            if response.status_code != 200:
                print(f"DEBUG NEWSAPI SERVER ERROR -> Code: {response.status_code} | Msg: {data}")
                return Response(data, status=response.status_code)
                
            articles = data.get("articles", [])
            
        except requests.exceptions.RequestException as system_error:
            # THIS PRINT WILL SHOW THE EXACT TIMEOUT/CONNECTION EXCEPTION IN YOUR TERMINAL
            print(f"CRITICAL BACKEND EXCEPTION -> {system_error}")
            return Response(
                {"error": "Failed to connect to the news provider", "details": str(system_error)}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Free tier: strip article content
        user = request.user
        if user.tier == user.TIER_FREE:
            articles = [
                {
                    "title": a["title"],
                    "source": a["source"],
                    "publishedAt": a["publishedAt"],
                    "urlToImage": a["urlToImage"],
                    "url": a["url"],
                    "description": a["description"],
                    "content": None,  # paywalled
                }
                for a in articles
            ]

        return Response({"articles": articles})
