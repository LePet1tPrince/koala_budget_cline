from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaidViewSet, PlaidItemViewSet

router = DefaultRouter()
router.register('items', PlaidItemViewSet, basename='plaid-item')

# Create a router for Plaid API endpoints
plaid_router = DefaultRouter()
plaid_router.register('', PlaidViewSet, basename='plaid')

urlpatterns = [
    path('', include(router.urls)),
    path('api/', include(plaid_router.urls)),
]
