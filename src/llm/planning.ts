
import { getLLMClient } from './client';
import type { ExecutionPlan, PlanStep, LLMContext } from './types';

export class PlanningAgent {

  async createPlan(task: string, context?: LLMContext): Promise<ExecutionPlan> {
    const llm = getLLMClient();
    
    const planningPrompt = this.buildPlanningPrompt(task, context);
    
    try {
      const response = await llm.generateResponse(planningPrompt, context);
      const plan = this.parsePlanFromResponse(response.content);
      
      return {
        goal: task,
        steps: plan.steps,
        totalEstimatedTime: plan.totalEstimatedTime,
        resources: plan.resources,
        alternatives: plan.alternatives,
      };
    } catch (error) {
      console.error('Planning error:', error);
      // Fallback to simple plan
      return this.createFallbackPlan(task);
    }
  }


  async updatePlan(
    currentPlan: ExecutionPlan,
    newInformation: string,
    context?: LLMContext
  ): Promise<ExecutionPlan> {
    const llm = getLLMClient();
    
    const updatePrompt = `Current Plan:
${this.formatPlan(currentPlan)}

New Information:
${newInformation}

Please update the plan to incorporate this new information. Maintain the same format.`;

    try {
      const response = await llm.generateResponse(updatePrompt, context);
      return this.parsePlanFromResponse(response.content);
    } catch (error) {
      console.error('Plan update error:', error);
      return currentPlan;
    }
  }


  async validatePlan(plan: ExecutionPlan, context?: LLMContext): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const llm = getLLMClient();
    
    const validationPrompt = `Please validate this execution plan:
${this.formatPlan(plan)}

Check for:
1. Logical dependencies between steps
2. Feasibility of each step
3. Missing steps or prerequisites
4. Potential risks or blockers

Return a JSON response with:
{
  "isValid": boolean,
  "issues": string[],
  "suggestions": string[]
}`;

    try {
      const response = await llm.generateResponse(validationPrompt, context);
      return this.parseValidationResponse(response.content);
    } catch (error) {
      console.error('Plan validation error:', error);
      return {
        isValid: true,
        issues: [],
        suggestions: [],
      };
    }
  }

  private buildPlanningPrompt(task: string, context?: LLMContext): string {
    let prompt = `You are an expert project planner. Break down the following task into clear, executable steps.

Task: ${task}

Please provide a detailed execution plan in the following format:

GOAL: [Restate the main goal]

STEPS:
1. [Step description]
   - Estimated time: [time estimate]
   - Dependencies: [step numbers this depends on]
   - Risk level: [low/medium/high]

2. [Step description]
   - Estimated time: [time estimate]
   - Dependencies: [step numbers this depends on]
   - Risk level: [low/medium/high]

[Continue as needed]

TOTAL ESTIMATED TIME: [overall time estimate]

RESOURCES: [list of resources, tools, or information needed]

ALTERNATIVES: [alternative approaches if main plan fails]

Make sure each step is:
- Specific and actionable
- Reasonably scoped
- Logically ordered
- Has clear dependencies`;

    if (context?.projectContext) {
      prompt += `\n\nProject Context:
- Working directory: ${context.projectContext.root}
- Git branch: ${context.projectContext.branch || 'main'}
- Current status: ${context.projectContext.isDirty ? 'Has uncommitted changes' : 'Clean working directory'}`;
    }

    return prompt;
  }


  private parsePlanFromResponse(response: string): Partial<ExecutionPlan> {
    const steps: PlanStep[] = [];
    let totalEstimatedTime: string | undefined;
    const resources: string[] = [];
    const alternatives: string[] = [];

    // Parse steps
    const stepsMatch = response.match(/STEPS:([\s\S]*?)(?:TOTAL ESTIMATED TIME|RESOURCES|ALTERNATIVES|$)/i);
    if (stepsMatch) {
      const stepBlocks = stepsMatch[1].split(/\d+\./).filter(block => block.trim());
      
      stepBlocks.forEach((block, index) => {
        const description = block.split('\n')[0].trim();
        const timeMatch = block.match(/estimated time:\s*(.+)/i);
        const depsMatch = block.match(/dependencies:\s*(.+)/i);
        const riskMatch = block.match(/risk level:\s*(.+)/i);

        steps.push({
          description,
          estimatedTime: timeMatch ? timeMatch[1].trim() : undefined,
          dependencies: depsMatch ? depsMatch[1].split(',').map(d => d.trim()) : undefined,
          riskLevel: riskMatch ? riskMatch[1].trim().toLowerCase() as any : 'medium',
        });
      });
    }

    // Parse total time
    const timeMatch = response.match(/total estimated time:\s*(.+)/i);
    if (timeMatch) {
      totalEstimatedTime = timeMatch[1].trim();
    }

    // Parse resources
    const resourcesMatch = response.match(/RESOURCES:([\s\S]*?)(?:ALTERNATIVES|$)/i);
    if (resourcesMatch) {
      const resourceLines = resourcesMatch[1].split('\n').filter(line => line.trim());
      resources.push(...resourceLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    // Parse alternatives
    const altMatch = response.match(/ALTERNATIVES:([\s\S]*)/i);
    if (altMatch) {
      const altLines = altMatch[1].split('\n').filter(line => line.trim());
      alternatives.push(...altLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    return { steps, totalEstimatedTime, resources, alternatives };
  }

  private parseValidationResponse(response: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.isValid || true,
          issues: parsed.issues || [],
          suggestions: parsed.suggestions || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse validation response:', error);
    }

    // Fallback: simple keyword analysis
    const isValid = !response.toLowerCase().includes('invalid') && 
                   !response.toLowerCase().includes('cannot be executed');
    
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (response.toLowerCase().includes('missing')) {
      issues.push('Plan may be missing steps');
    }
    if (response.toLowerCase().includes('risk')) {
      issues.push('Plan contains potential risks');
    }
    if (response.toLowerCase().includes('suggest')) {
      suggestions.push('Consider reviewing the plan for optimizations');
    }

    return { isValid, issues, suggestions };
  }

  private formatPlan(plan: ExecutionPlan): string {
    let formatted = `GOAL: ${plan.goal}\n\n`;
    formatted += 'STEPS:\n';
    
    plan.steps.forEach((step, index) => {
      formatted += `${index + 1}. ${step.description}\n`;
      if (step.estimatedTime) formatted += `   - Estimated time: ${step.estimatedTime}\n`;
      if (step.dependencies) formatted += `   - Dependencies: ${step.dependencies.join(', ')}\n`;
      if (step.riskLevel) formatted += `   - Risk level: ${step.riskLevel}\n`;
    });

    if (plan.totalEstimatedTime) {
      formatted += `\nTOTAL ESTIMATED TIME: ${plan.totalEstimatedTime}\n`;
    }

    if (plan.resources && plan.resources.length > 0) {
      formatted += `\nRESOURCES:\n`;
      plan.resources.forEach(resource => {
        formatted += `- ${resource}\n`;
      });
    }

    if (plan.alternatives && plan.alternatives.length > 0) {
      formatted += `\nALTERNATIVES:\n`;
      plan.alternatives.forEach(alt => {
        formatted += `- ${alt}\n`;
      });
    }

    return formatted;
  }

  private createFallbackPlan(task: string): ExecutionPlan {
    return {
      goal: task,
      steps: [
        {
          description: `Analyze requirements for: ${task}`,
          estimatedTime: '5 minutes',
          riskLevel: 'low',
        },
        {
          description: 'Identify necessary resources and dependencies',
          estimatedTime: '3 minutes',
          dependencies: ['1'],
          riskLevel: 'low',
        },
        {
          description: 'Execute the main task',
          estimatedTime: '15 minutes',
          dependencies: ['2'],
          riskLevel: 'medium',
        },
        {
          description: 'Verify and test the results',
          estimatedTime: '5 minutes',
          dependencies: ['3'],
          riskLevel: 'low',
        },
      ],
      totalEstimatedTime: '30 minutes',
      resources: ['Development environment', 'Required tools'],
      alternatives: ['Break down into smaller subtasks', 'Seek clarification on requirements'],
    };
  }
}

let planningAgentInstance: PlanningAgent | null = null;

export function getPlanningAgent(): PlanningAgent {
  if (!planningAgentInstance) {
    planningAgentInstance = new PlanningAgent();
  }
  return planningAgentInstance;
}