from django.urls import path
from .views import FlowReportView, BalanceReportView, SavingGoalsReportView

urlpatterns = [
    path('flow/', FlowReportView.as_view(), name='flow_report'),
    path('balance/', BalanceReportView.as_view(), name='balance_report'),
    path('saving-goals/', SavingGoalsReportView.as_view(), name='saving_goals_report'),
]
